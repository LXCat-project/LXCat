import { useState } from "react";

// TODO remove static component once StateFilter is working
export const StateFilterStatic = () => {
  return (
    <div>
      <span>
        State selection with Ar element or N2 (neutral charge) molecule and
        bunch of subselections on N2
      </span>
      <ul>
        <li>
          <div className="particle-charge-filter">
            <label>
              <input type="checkbox" checked />
              N2
            </label>
          </div>
          <div className="type">
            <ul>
              <li>
                <div className="type-filter">
                  <label>
                    <input type="checkbox" />
                    Simple
                  </label>
                </div>
              </li>
              <li>
                <div className="type-filter">
                  <label>
                    <input type="checkbox" checked />
                    HomonuclearDiatom
                  </label>
                </div>
                <div>
                  <span>Electronic</span>
                  <div style={{ display: "flex" }}>
                    <div>
                      <label>
                        e
                        <select multiple>
                          <option>NA</option>
                          <option selected>X</option>
                          <option>A</option>
                          <option>W</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <label>
                        Lambda
                        <select multiple>
                          <option>NA</option>
                          <option selected>0</option>
                          <option>1</option>
                          <option>2</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <label>
                        Parity
                        <select multiple>
                          <option>NA</option>
                          <option selected>gerade</option>
                          <option>ungerade</option>
                        </select>
                      </label>
                    </div>
                    <div>
                      <label>
                        Reflection
                        <select multiple>
                          <option>NA</option>
                          <option selected>+</option>
                          <option>-</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label>
                      <input type="checkbox" checked />
                      Vibrational
                    </label>
                    <ul>
                      <li>
                        <label>
                          <input type="checkbox" checked />
                          v=1,2,3,4,5
                        </label>
                      </li>
                      <li>
                        <label>
                          <input type="checkbox" />
                          v=42
                        </label>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </li>
        <li>
          <div className="type">
            <label>
              <input type="checkbox" />
              N2^+
            </label>
          </div>
        </li>
        <li>
          <div className="type">
            <label>
              <input type="checkbox" checked />
              Ar
            </label>
          </div>
          <ul>
            <li>
              <div className="type-filter">
                <label>
                  <input type="checkbox" />
                  AtomLS
                </label>
              </div>
            </li>
            <li>
              <div className="type-filter">
                <label>
                  <input type="checkbox" />
                  AtomJ1L2
                </label>
              </div>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

const ParticleFilter = ({ selected, particle, charge, onToggleParticle }) => {
  return (
    <li>
      <div className="particle-charge-filter">
        <label>
          <input type="checkbox" checked={selected} onChange={() => onToggleParticle(particle, charge)}/>
          {particle}
          {charge !== 0 ? `^${charge}` : ""}
        </label>
      </div>
    </li>
  );
};

export const StateFilter = () => {
  const [states, setStates] = useState([
    {
      particle: "N2",
      selected: true,
      charge: 0,
    },
    {
      particle: "N2",
      selected: false,
      charge: 1,
    },
  ]);

  function toggleParticle(particle: string, charge: number) {
    const stateIndex = states.findIndex(s => s.particle === particle && s.charge === charge)
    if (stateIndex === -1) {
        throw Error('Unable to find state with given particle and charge')
    }
    const newState = {...states[stateIndex], selected: !states[stateIndex].selected}
    const newStates = [...states]
    newStates[stateIndex] = newState
    setStates(newStates)
  }
  return (
    <ul>
      {states.map((s) => (
        <ParticleFilter key={`${s.particle}-${s.charge}`} onToggleParticle={toggleParticle} {...s} />
      ))}
    </ul>
  );
};
