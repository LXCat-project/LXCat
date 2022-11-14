// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

mod types;

use std::fmt::Write;
use std::{collections::HashMap, error::Error};

use napi::bindgen_prelude::*;
use napi_derive::napi;

use types::{Document, Parameters, Reaction, State, StateEntry};

fn get_particles<'a>(
    reaction: &'a Reaction<String>,
    state_map: &'a HashMap<String, State>,
) -> Vec<&'a str> {
    let mut particles: Vec<&str> = Vec::new();

    reaction
        .lhs
        .iter()
        .chain(reaction.rhs.iter())
        .map(|entry| state_map[entry.state.as_str()].particle.as_str())
        .for_each(|particle| {
            if !particles.contains(&particle) {
                particles.push(particle);
            }
        });

    particles
}

fn get_species(entries: &Vec<StateEntry<String>>) -> Vec<&str> {
    entries
        .iter()
        .filter_map(|entry| {
            if entry.state != "e" {
                Some(entry.state.as_str())
            } else {
                None
            }
        })
        .collect()
}

fn get_reaction_summary(reaction: &Reaction<String>) -> Result<String> {
    let lhs_species = get_species(&reaction.lhs);

    if reaction
        .type_tags
        .iter()
        .any(|tag| tag == "Elastic" || tag == "Effective")
    {
        return Ok(lhs_species[0].to_string());
    }

    let rhs_species = get_species(&reaction.rhs);

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

fn fold_entry(entry: &StateEntry<String>) -> String {
    std::iter::repeat(entry.state.as_str())
        .take(entry.count as usize)
        .fold(String::new(), |string, elem| {
            if string.is_empty() {
                string + simplify_electrons(elem)
            } else {
                string + " + " + simplify_electrons(elem)
            }
        })
}

fn parse_entries(entries: &[StateEntry<String>]) -> String {
    entries.iter().fold(String::new(), |expr, entry| {
        if expr.is_empty() {
            fold_entry(entry)
        } else {
            expr + " + " + fold_entry(entry).as_str()
        }
    })
}

fn get_mass_ratio(parameters: &Option<Parameters>) -> Option<f64> {
    parameters.as_ref()?.mass_ratio
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
    pub fn into_legacy(mut self) -> std::result::Result<String, Box<dyn Error>> {
        let mut legacy = String::new();

        let self_reference = format!(
            "{}\nPERMLINK:         {}\nTERMS OF USE:     {}\n{}\n",
            END, self.url, self.terms_of_use, END
        );

        write!(
            legacy,
            "{}\n\nCOMMENT: {}\n\n{}\n{}\n",
            STARS, self.description, self_reference, STARS
        )?;

        for process in self.processes.iter_mut() {
            let tag = parse_tag(&process.reaction.type_tags);

            write!(legacy, "\n{}", tag.to_uppercase())?;
            write!(
                legacy,
                "\n{}",
                get_reaction_summary(&process.reaction).unwrap()
            )?;
            write!(
                legacy,
                "\n {:.6e}",
                match tag.to_uppercase().as_str() {
                    "EFFECTIVE" | "ELASTIC" => get_mass_ratio(&process.parameters)
                        .ok_or_else(|| ParserError::MissingMassRatio(process.id.clone()))?,
                    _ => process.threshold,
                }
            )?;
            write!(
                legacy,
                "\nSPECIES: {}",
                get_particles(&process.reaction, &self.states).join(" / ")
            )?;
            write!(
                legacy,
                "\nPROCESS: {} {}-> {}, {}",
                parse_entries(&process.reaction.lhs),
                match process.reaction.reversible {
                    true => "<",
                    false => "",
                },
                parse_entries(&process.reaction.rhs),
                tag
            )?;

            match tag {
                "Effective" | "Elastic" => {
                    write!(
                        legacy,
                        "\nPARAM.:  m/M = {}",
                        get_mass_ratio(&process.parameters)
                            .ok_or_else(|| ParserError::MissingMassRatio(process.id.clone()))?,
                    )
                }
                _ => {
                    write!(
                        legacy,
                        "\nPARAM.:  E = {} {}",
                        process.threshold, process.units.0
                    )
                }
            }?;

            // TODO: It seems that supplying a statistical weight ratio is optional for
            // reversible processes, see for example IST-Lisbon, N2. Is this correct, or should
            // the dataset be perceived as faulty?
            if process.reaction.reversible {
                if let Some(params) = &process.parameters {
                    if let Some(sw_ratio) = params.statistical_weight_ratio {
                        write!(legacy, ", g1/g0 = {}", sw_ratio)?;
                    }
                }
            }
            if self.complete {
                write!(legacy, ", complete set")?;
            }
            for reference in &process.reference {
                write!(legacy, "\nCOMMENT: {}", self.references[reference].as_str())?;
            }
            write!(
                legacy,
                "\nCOLUMNS: {} ({}) | {} ({})",
                process.labels.0, process.units.0, process.labels.1, process.units.1
            )?;
            write!(legacy, "\n-----------------------------")?;
            for (x, y) in process.data.iter() {
                write!(legacy, "\n {:+.6e}\t{:.6e}", x, y)?;
            }
            writeln!(legacy, "\n-----------------------------")?;
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
