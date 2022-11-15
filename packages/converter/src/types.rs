// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: Apache-2.0

use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
pub struct StateEntry<StateType> {
    pub count: u32,
    pub state: StateType,
}

#[derive(Debug, Deserialize)]
pub struct Reaction<StateType> {
    pub lhs: Vec<StateEntry<StateType>>,
    pub rhs: Vec<StateEntry<StateType>>,
    pub reversible: bool,
    pub type_tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Parameters {
    pub mass_ratio: Option<f64>,
    pub statistical_weight_ratio: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct Process {
    pub id: String,
    pub reaction: Reaction<String>,
    pub parameters: Option<Parameters>,
    pub reference: Vec<String>,
    pub labels: (String, String),
    pub units: (String, String),
    pub threshold: f64,
    pub data: Vec<(f64, f64)>,
}

#[derive(Debug, Deserialize)]
pub struct State {
    // pub id: String,
    pub particle: String,
    pub charge: i32,
}

#[derive(Debug, Deserialize)]
pub struct Document {
    pub name: String,
    pub contributor: String,
    pub description: String,
    pub complete: bool,
    pub processes: Vec<Process>,
    pub states: HashMap<String, State>,
    pub references: HashMap<String, String>,
    pub url: String,
    pub terms_of_use: String,
}

#[derive(Debug, Deserialize)]
pub struct SetHeader {
    pub name: String,
    pub description: String,
    pub complete: bool,
    pub organization: String,
}

#[derive(Debug, Deserialize)]
pub struct CSItem {
    pub id: String,
    pub is_part_of: Vec<SetHeader>,
    pub parameters: Option<Parameters>,
    pub threshold: f64,
    pub reaction: Reaction<State>,
    pub reference: Vec<String>,
}
