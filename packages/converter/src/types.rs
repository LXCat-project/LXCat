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
#[serde(rename_all = "camelCase")]
pub struct Reaction<StateType> {
    pub lhs: Vec<StateEntry<StateType>>,
    pub rhs: Vec<StateEntry<StateType>>,
    pub reversible: bool,
    pub type_tags: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Parameters {
    pub mass_ratio: Option<f64>,
    pub statistical_weight_ratio: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct LUT {
    pub labels: (String, String),
    pub units: (String, String),
    pub values: Vec<(f64, f64)>,
}

#[derive(Debug, Deserialize)]
pub struct ReferenceWithComments {
    pub id: String,
    pub comments: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum ReferenceRef {
    Id(String),
    WithComment(ReferenceWithComments),
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    #[serde(rename = "_key")]
    pub id: String,
    pub parameters: Option<Parameters>,
    pub comments: Option<Vec<String>>,
    pub references: Vec<ReferenceRef>,
    pub threshold: f64,
    #[serde(default)]
    pub is_part_of: Option<Vec<String>>,
    pub data: LUT,
}

#[derive(Debug, Deserialize)]
pub struct Process {
    pub reaction: Reaction<String>,
    pub info: Vec<ProcessInfo>,
}

#[derive(Debug, Deserialize)]
pub struct SerializedState {
    pub particle: String,
    pub charge: i32,
    pub summary: String,
    pub latex: String,
}

#[derive(Debug, Deserialize)]
pub struct State {
    #[serde(default)]
    #[serde(rename = "_key")]
    pub id: Option<String>,
    pub serialized: SerializedState,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Contributor {
    pub name: String,
    pub description: String,
    pub contact: String,
    pub how_to_reference: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub name: String,
    pub contributor: Contributor,
    pub description: String,
    pub complete: bool,
    pub processes: Vec<Process>,
    pub states: HashMap<String, State>,
    pub references: HashMap<String, String>,
    pub url: String,
    pub terms_of_use: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Mixture {
    pub sets: HashMap<String, SetHeader>,
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
    pub contributor: Contributor,
}
