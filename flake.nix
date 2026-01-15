{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    vips-pin.url = "github:nixos/nixpkgs/nixos-25.11";

    bun2nix-input = {
      url = "github:nix-community/bun2nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    fenix = {
      url = "github:nix-community/fenix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs =
    {
      self,
      bun2nix-input,
      fenix,
      nixpkgs,
      vips-pin,
    }:
    let
      system = "x86_64-linux";
      pkgs = (nixpkgs.legacyPackages.${system}.extend fenix.overlays.default);
      bun2nix = bun2nix-input.packages.${system}.default;

      rust =
        with pkgs.fenix;
        (combine [
          default.rustc
          default.cargo
          default.rustfmt
          default.clippy
          targets.wasm32-unknown-unknown.latest.rust-std
          targets.wasm32-unknown-emscripten.latest.rust-std
        ]);
    in
    {
      devShell.${system} =
        with pkgs;
        mkShell {
          name = "lxcat";
          buildInputs = [
            # Node
            nodejs-slim_24
            nodejs_24.pkgs.pnpm

            # Bun
            bun
            bun2nix

            # GitHub actions
            act

            # Turborepo
            turbo

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
            wasm-pack

            # License management
            reuse
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
          '';
        };
      packages.${system} =
        let
          fs = pkgs.lib.fileset;
        in
        rec {
          bun-nix = pkgs.stdenv.mkDerivation {
            pname = "bun-nix";
            version = "0.0.1";

            src = fs.toSource {
              root = ./.;
              fileset = ./bun.lock;
            };

            nativeBuildInputs = with pkgs; [
              jq
              bun2nix
            ];

            buildPhase = ''
              jq -n -f bun.lock | jq '.packages = (.packages | with_entries(select((.value[2].cpu == null and (.value[0] | contains("lxcat") == false)) or (.value[2].cpu == "x64" and .value[2].os == "linux"))))' > bun.lock.filtered
              bun2nix -l bun.lock.filtered -o bun.nix
            '';

            installPhase = ''
              mkdir $out
              cp bun.nix $out
            '';
          };
          converter =
            (pkgs.makeRustPlatform {
              cargo = rust;
              rustc = rust;
            }).buildRustPackage
              rec {
                pname = "converter";
                version = "0.0.0";

                nativeBuildInputs = [ bun2nix.hook ];

                bunDeps = lxcat-deps;

                buildPhase = ''
                  runHook preBuild

                  (cd packages/converter && bun run build)

                  runHook postBuild
                '';

                doCheck = false;

                installPhase = ''
                  mkdir $out
                  cd packages/converter
                  cp -r package.json dist $out
                '';

                src = fs.toSource {
                  root = ./.;
                  fileset = fs.unions [
                    ./package.json
                    ./bun.lock
                    ./packages/tsconfig/package.json
                    ./app/package.json
                    ./packages/schema/package.json
                    ./packages/converter
                    ./packages/database/package.json
                    ./packages/node-loader/package.json
                  ];
                };

                cargoRoot = "./packages/converter";
                cargoLock.lockFile = ./packages/converter/Cargo.lock;
              };
          # NOTE: For some reason `vips` does not provide `libvips-cpp.so.8.17.3`,
          # `vips-patched` creates the missing symlinks.
          vips-patched =
            let
              vips = vips-pin.legacyPackages.${system}.vips.out;
            in
            pkgs.stdenv.mkDerivation rec {
              pname = "vips-patched";
              version = vips.version;
              src = "${vips}";

              installPhase = ''
                mkdir $out
                cp -r * $out

                ln -s $out/lib/libvips.so $out/lib/libvips.so.${version}
                ln -s $out/lib/libvips-cpp.so $out/lib/libvips-cpp.so.${version}
              '';
            };
          lxcat-deps = bun2nix.fetchBunDeps {
            bunNix = "${bun-nix}/bun.nix";
            autoPatchElf = true;
            nativeBuildInputs = with pkgs; [
              # swc
              musl

              # sharp
              gcc
              libgcc
              vips-patched
            ];
          };
          lxcat-tsconfig = bun2nix.mkDerivation {
            pname = "lxcat-tsconfig";
            version = "0.0.0";

            src = fs.toSource {
              root = ./.;
              fileset = fs.unions [
                ./package.json
                ./bun.lock
                ./packages/tsconfig
                ./app/package.json
                ./packages/schema/package.json
                ./packages/converter/package.json
                ./packages/database/package.json
                ./packages/node-loader/package.json
              ];
            };
          };
          lxcat-schema = bun2nix.mkDerivation {
            pname = "lxcat-schema";
            version = "0.0.0";

            src = fs.toSource {
              root = ./.;
              fileset = fs.unions [
                ./package.json
                ./bun.lock
                ./packages/schema
                ./app/package.json
                ./packages/converter/package.json
                ./packages/database/package.json
                ./packages/tsconfig
                ./packages/node-loader/package.json
              ];
            };

            bunDeps = lxcat-deps;

            buildPhase = ''
              (cd packages/schema && bun run build)
            '';

            installPhase = ''
              mkdir $out
              cp -r package.json ./packages/schema/dist $out
            '';
          };
          lxcat-database = bun2nix.mkDerivation {
            pname = "lxcat-database";
            version = "0.0.0";

            src = fs.toSource {
              root = ./.;
              fileset = fs.unions [
                ./package.json
                ./bun.lock
                ./packages/schema/package.json
                ./app/package.json
                ./packages/converter/package.json
                ./packages/database
                ./packages/tsconfig
                ./packages/node-loader/package.json
              ];
            };

            bunDeps = lxcat-deps;

            buildPhase = ''
              cp -r ${lxcat-schema}/dist packages/schema/dist
              bun run --filter @lxcat/database build
            '';

            installPhase = ''
              mkdir $out
              cp -r package.json ./packages/database/dist $out
            '';
          };
          lxcat-node-loader = bun2nix.mkDerivation {
            pname = "lxcat-node-loader";
            version = "0.0.0";

            src = fs.toSource {
              root = ./.;
              fileset = fs.unions [
                ./package.json
                ./bun.lock
                ./packages/schema/package.json
                ./app/package.json
                ./packages/converter/package.json
                ./packages/database/package.json
                ./packages/tsconfig/package.json
                ./packages/node-loader
              ];
            };

            bunDeps = lxcat-deps;

            buildPhase = ''
              bun run --filter @lxcat/node-loader build
            '';

            installPhase = ''
              mkdir $out
              cp -r package.json ./packages/node-loader/dist $out
            '';
          };
          lxcat = bun2nix.mkDerivation {
            pname = "lxcat";
            version = "0.0.0";

            # src = ./.;
            src = fs.toSource {
              root = ./.;
              fileset = fs.unions [
                ./package.json
                ./bun.lock
                ./packages/schema/package.json
                ./packages/database/package.json
                ./packages/converter/package.json
                ./packages/tsconfig
                ./packages/node-loader/package.json
                ./docs
                ./app
              ];
            };

            env = {
              LXCAT_BUILD_ENV = "production";
            };

            nativeBuildInputs = [ pkgs.makeWrapper ];

            buildPhase = ''
              # NOTE: This does not work as the files in the symlinked `dist`
              #       folder cannot access the `node_modules`.
              # ln -s ${lxcat-schema}/dist packages/schema/dist

              cp -r ${lxcat-schema}/dist packages/schema/dist
              cp -r ${lxcat-database}/dist packages/database/dist
              cp -r ${lxcat-node-loader}/dist packages/node-loader/dist

              # Symlink the prebuilt `nix` `converter` package.
              ln -s ${converter}/dist packages/converter/dist

              (cd app && bun run build)
            '';

            installPhase = ''
              mkdir -p $out/share
              mkdir -p $out/bin

              # NOTE: Patch `.node` `dlopen` paths, as they otherwise point to the
              #       temporary build directory.
              # TODO: Should we only replace paths related to `.node` loading?
              find app/.next/standalone/app/.next -name "*.js" | xargs -I {} sed -i "s|$(pwd)|$out/share/lxcat|g" {}

              cp -r app/.next/standalone $out/share/lxcat
              cp -r app/public $out/share/lxcat/app
              cp -r app/.next/static $out/share/lxcat/app/.next

              makeWrapper ${pkgs.bun}/bin/bun "$out/bin/lxcat" --add-flags "$out/share/lxcat/app/server.js"
            '';

            bunDeps = lxcat-deps;
          };
          lxcat-server-image = pkgs.dockerTools.buildLayeredImage {
            name = "lxcat-server";
            tag = "latest";

            config = {
              ExposedPorts = {
                "3000" = { };
              };
              Cmd = [ "${lxcat}/bin/lxcat" ];
            };
          };
        };
    };
}
