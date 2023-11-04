{
  inputs = {
    stable.url = "github:nixos/nixpkgs/23.05";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    turbo = {
      url = "github:alexghr/turborepo.nix/v1.10.15";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs = { self, fenix, stable, nixpkgs, turbo }:
    let
      system = "x86_64-linux";
      pkgs = (nixpkgs.legacyPackages.${system}.extend fenix.overlays.default);

      stablepkgs = stable.legacyPackages.${system};

      rust = (pkgs.fenix.stable.withComponents [
        "cargo"
        "rustc"
        "rustfmt"
        "clippy"
      ]);
    in {
      devShell.${system} = with pkgs;
        mkShell {
          name = "lxcat";
          buildInputs = [
            # Node
            nodejs-slim_18
            nodejs_18.pkgs.pnpm
            nodejs_18.pkgs.ts-node

            # Next
            turbo.packages.${system}.default

            # End-to-end testing
            playwright

            # Typescript
            nodePackages_latest.typescript
            nodePackages_latest.typescript-language-server

            # Formatting
            dprint

            # Docker
            docker
            docker-compose

            # Rust
            rust
            rust-analyzer

            # License management
            reuse
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH=${playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            export TURBO_BINARY_PATH="${
              turbo.packages.${system}.default
            }/bin/turbo"
          '';
        };
    };
}
