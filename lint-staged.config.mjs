import fs from "node:fs";
import path from "node:path";

export default {
  "{apps,packages}/**/*.{js,jsx,ts,tsx}": (filenames) => {
    const filesByPackage = new Map();

    for (const file of filenames) {
      const relative = path.relative(process.cwd(), file);
      const parts = relative.split(path.sep);

      if (parts.length >= 2 && (parts[0] === "apps" || parts[0] === "packages")) {
        const pkgDir = path.join(parts[0], parts[1]);
        const pkgJsonPath = path.join(process.cwd(), pkgDir, "package.json");

        // Only lint if the workspace package exists and has a package.json
        if (fs.existsSync(pkgJsonPath)) {
          if (!filesByPackage.has(pkgDir)) {
            filesByPackage.set(pkgDir, []);
          }
          const fileRelToPkg = path.relative(path.join(process.cwd(), pkgDir), file);
          filesByPackage.get(pkgDir).push(`"${fileRelToPkg}"`);
        }
      }
    }

    const commands = [];
    for (const [pkgDir, files] of filesByPackage.entries()) {
      commands.push(`pnpm --filter ./${pkgDir} exec eslint --fix ${files.join(" ")}`);
    }

    return commands;
  },
};
