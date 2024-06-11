// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

mod types;

use std::fmt::Write;
use std::{collections::HashMap, error::Error};

use napi::bindgen_prelude::*;
use napi_derive::napi;

use types::{Document, Mixture, Parameters, Process, Reaction, ReferenceRef, State, StateEntry};

fn get_particles<'a>(
    reaction: &Reaction<String>,
    state_map: &'a HashMap<String, State>,
) -> Vec<&'a str> {
    let mut particles: Vec<&str> = Vec::new();

    reaction
        .lhs
        .iter()
        .map(|entry| {
            state_map[entry.state.as_str()]
                .serialized
                .composition
                .summary
                .as_str()
        })
        .map(simplify_electrons)
        .for_each(|particle| {
            if !particles.contains(&particle) {
                particles.push(particle);
            }
        });

    particles
}

fn get_state_id<'a>(
    entry: &'a StateEntry<String>,
    state_map: &'a HashMap<String, State>,
) -> &'a str {
    simplify_electrons(&state_map[&entry.state].serialized.summary)
    // match &state_map[&entry.state].id {
    //     None => &entry.state,
    //     Some(id) => id,
    // }
}

fn get_species<'a>(
    entries: &'a Vec<StateEntry<String>>,
    state_map: &'a HashMap<String, State>,
) -> Vec<&'a str> {
    entries
        .iter()
        .map(|entry| get_state_id(entry, state_map))
        .filter_map(|id| if id != "e" { Some(id) } else { None })
        .collect()
}

fn get_reaction_summary(
    reaction: &Reaction<String>,
    state_map: &HashMap<String, State>,
) -> Result<String> {
    let lhs_species = get_species(&reaction.lhs, state_map);

    if reaction
        .type_tags
        .iter()
        .any(|tag| tag == "Elastic" || tag == "Effective")
    {
        return Ok(lhs_species[0].to_string());
    }

    let rhs_species = get_species(&reaction.rhs, state_map);

    if lhs_species.len() == 0 {}

    match (lhs_species.len(), rhs_species.len()) {
        (0, _) => Err(napi::Error::new(
            napi::Status::Unknown,
            format!(
                "Zero significant species found on lhs of reaction: {:?}.",
                reaction
            ),
        )),
        (_, 0) => Err(napi::Error::new(
            napi::Status::Unknown,
            format!(
                "Zero significant species found on rhs of reaction: {:?}.",
                reaction
            ),
        )),
        _ => Ok(format!(
            "{} -> {}",
            lhs_species.join(" + "),
            rhs_species.join(" + ")
        )),
    }
}

fn parse_tag(type_tags: &[String]) -> &str {
    let tag = &type_tags[0];

    match tag.as_str() {
        "Electronic" | "Vibrational" | "Rotational" => "Excitation",
        _ => tag.as_str(),
    }
}

fn simplify_electrons(state: &str) -> &str {
    if state == "e^-" {
        "e"
    } else {
        state
    }
}

fn fold_entry(count: u32, state: &str) -> String {
    std::iter::repeat(state)
        .take(count as usize)
        .fold(String::new(), |string, elem| {
            if string.is_empty() {
                string + simplify_electrons(elem)
            } else {
                string + " + " + simplify_electrons(elem)
            }
        })
}

fn parse_entries(entries: &[StateEntry<String>], states: &HashMap<String, State>) -> String {
    entries.iter().fold(String::new(), |expr, entry| {
        let id = &states[&entry.state].serialized.summary;
        //     match &states[&entry.state].id {
        //     None => &entry.state,
        //     Some(id) => id,
        // };

        if expr.is_empty() {
            fold_entry(entry.count, id)
        } else {
            expr + " + " + fold_entry(entry.count, id).as_str()
        }
    })
}

fn get_mass_ratio(parameters: &Option<Parameters>) -> Option<f64> {
    parameters.as_ref()?.mass_ratio
}

fn parse_process(
    mut buffer: String,
    process: &Process,
    complete: bool,
    states: &HashMap<String, State>,
    references: &HashMap<String, String>,
) -> std::result::Result<String, Box<dyn Error>> {
    let tag = parse_tag(&process.reaction.type_tags);

    for info in &process.info {
        write!(buffer, "\n{}", tag.to_uppercase())?;
        write!(
            buffer,
            "\n{}",
            get_reaction_summary(&process.reaction, states)?
        )?;
        write!(
            buffer,
            "\n {:.6e}",
            match tag.to_uppercase().as_str() {
                "EFFECTIVE" | "ELASTIC" => get_mass_ratio(&info.parameters)
                    .ok_or_else(|| ParserError::MissingMassRatio(info.id.clone()))?,
                _ => info.threshold,
            }
        )?;
        write!(
            buffer,
            "\nSPECIES: {}",
            get_particles(&process.reaction, &states).join(" / ")
        )?;
        write!(
            buffer,
            "\nPROCESS: {} {}-> {}, {}",
            parse_entries(&process.reaction.lhs, states),
            match process.reaction.reversible {
                true => "<",
                false => "",
            },
            parse_entries(&process.reaction.rhs, states),
            tag
        )?;

        match tag {
            "Effective" | "Elastic" => {
                write!(
                    buffer,
                    "\nPARAM.:  m/M = {}",
                    get_mass_ratio(&info.parameters)
                        .ok_or_else(|| ParserError::MissingMassRatio(info.id.clone()))?,
                )
            }
            _ => {
                write!(
                    buffer,
                    "\nPARAM.:  E = {} {}",
                    info.threshold, info.data.units.0
                )
            }
        }?;

        // TODO: It seems that supplying a statistical weight ratio is optional for
        // reversible processes, see for example IST-Lisbon, N2. Is this correct, or should
        // the dataset be perceived as faulty?
        if process.reaction.reversible {
            if let Some(params) = &info.parameters {
                if let Some(sw_ratio) = params.statistical_weight_ratio {
                    write!(buffer, ", g1/g0 = {}", sw_ratio)?;
                }
            }
        }
        if complete {
            write!(buffer, ", complete set")?;
        }
        if let Some(comments) = &info.comments {
            for comment in comments {
                write!(buffer, "\nCOMMENT: {}", comment.trim())?;
            }
        }
        for reference in &info.references {
            match reference {
                ReferenceRef::Id(id) => write!(buffer, "\nCOMMENT: {}", references[id].trim())?,
                ReferenceRef::WithComment(reference) => {
                    write!(buffer, "\nCOMMENT: {}", references[&reference.id].trim())?;
                    for comment in &reference.comments {
                        write!(buffer, "\nCOMMENT: {}", comment.trim())?;
                    }
                }
            }
        }
        write!(
            buffer,
            "\nCOLUMNS: {} ({}) | {} ({})",
            info.data.labels.0, info.data.units.0, info.data.labels.1, info.data.units.1
        )?;
        write!(buffer, "\n-----------------------------")?;
        for (x, y) in info.data.values.iter() {
            write!(buffer, "\n {:.6e}\t{:.6e}", x, y)?;
        }
        writeln!(buffer, "\n-----------------------------")?;
    }

    Ok(buffer)
}

const STARS: &str = "************************************************************************************************************************";
const END: &str = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

#[derive(Debug)]
enum ParserError {
    MissingMassRatio(String),
}

impl std::fmt::Display for ParserError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParserError::MissingMassRatio(id) => {
                write!(
                    f,
                    "Missing mass ratio for Elastic or Effective cross section: {}.",
                    id
                )
            }
        }
    }
}

impl std::error::Error for ParserError {}

impl Document {
    pub fn into_legacy(self) -> std::result::Result<String, Box<dyn Error>> {
        let mut legacy = String::new();

        write!(
            legacy,
            "PERMLINK:     {}\nTERMS OF USE: {}\n\n",
            self.url, self.terms_of_use
        )?;

        write!(
            legacy,
            "{}\nDATABASE:         {}\nDESCRIPTION:      {}\n{}\n\n",
            END, self.contributor.name, self.description, END
        )?;

        for process in self.processes.into_iter() {
            legacy = parse_process(
                legacy,
                &process,
                self.complete,
                &self.states,
                &self.references,
            )?;
        }

        write!(legacy, "{}", END)?;

        Ok(legacy)
    }
}

impl Mixture {
    pub fn into_legacy(self) -> std::result::Result<String, Box<dyn Error>> {
        let mut legacy = String::new();

        write!(
            legacy,
            "PERMLINK:     {}\nTERMS OF USE: {}\n\n",
            self.url, self.terms_of_use
        )?;

        for (set_key, set) in self.sets.iter() {
            write!(
                legacy,
                "{}\nDATABASE:         {}\nDESCRIPTION:      {}\n{}\n",
                END, set.contributor.name, set.description, END
            )?;

            for process in self.processes.iter().filter(|&process| {
                process.info.iter().all(|info| {
                    info.is_part_of
                        .as_ref()
                        .map_or(false, |sets| sets.contains(set_key))
                })
            }) {
                legacy = parse_process(
                    legacy,
                    process,
                    set.complete,
                    &self.states,
                    &self.references,
                )?;
            }
        }

        write!(legacy, "{}", END)?;

        Ok(legacy)
    }
}

#[napi]
pub fn convert_document(json_string: serde_json::Value) -> Result<String> {
    let document: Document = serde_json::from_value(json_string)
        .map_err(|err| napi::Error::new(napi::Status::Unknown, err.to_string()))?;

    document
        .into_legacy()
        .map_err(|err| napi::Error::new(napi::Status::Cancelled, err.to_string()))
}

#[napi]
pub fn convert_mixture(json_string: serde_json::Value) -> Result<String> {
    let mixture: Mixture = serde_json::from_value(json_string)
        .map_err(|err| napi::Error::new(napi::Status::Unknown, err.to_string()))?;

    mixture
        .into_legacy()
        .map_err(|err| napi::Error::new(napi::Status::Cancelled, err.to_string()))
}
