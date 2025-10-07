const fs = require('fs-extra');
const { execSync } = require('child_process');

async function build() {
    try {
        console.log('Starting build process...');

        // Define paths
        const distDir = 'dist';
        const localesDir = 'locales';

        // 1. Clean and create the distribution directory
        console.log(`Cleaning and creating '${distDir}' directory...`);
        await fs.emptyDir(distDir);
        
        // 2. Transpile all TypeScript/TSX files to JavaScript
        console.log('Transpiling TypeScript/TSX files to JavaScript...');
        const babelCommand = `npx babel . --out-dir ${distDir} --extensions .ts,.tsx --presets=@babel/preset-react,@babel/preset-typescript --ignore "node_modules/**,dist/**" --keep-file-extension`;
        execSync(babelCommand, { stdio: 'inherit' });

        // 3. Rename .tsx files to .js in dist
        console.log('Renaming .tsx files to .js...');
        const renameFiles = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = `${dir}/${entry.name}`;
                if (entry.isDirectory()) {
                    await renameFiles(fullPath);
                } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
                    const newPath = fullPath.replace(/\.tsx?$/, '.js');
                    await fs.rename(fullPath, newPath);
                }
            }
        };
        await renameFiles(distDir);

        // 4. Fix import paths in JS files (remove .tsx/.ts extensions, add .js)
        console.log('Fixing import paths...');
        const fixImports = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = `${dir}/${entry.name}`;
                if (entry.isDirectory()) {
                    await fixImports(fullPath);
                } else if (entry.name.endsWith('.js')) {
                    let content = await fs.readFile(fullPath, 'utf8');
                    // Replace .tsx and .ts imports with .js
                    content = content.replace(/from\s+['"](.+?)\.tsx?['"]/g, "from '$1.js'");
                    await fs.writeFile(fullPath, content, 'utf8');
                }
            }
        };
        await fixImports(distDir);

        // 5. Copy static assets (locales folder and metadata)
        console.log(`Copying '${localesDir}' directory...`);
        await fs.copy(localesDir, `${distDir}/${localesDir}`);
        
        console.log('Copying metadata.json...');
        await fs.copy('metadata.json', `${distDir}/metadata.json`);
        
        // 6. Process and copy index.html for production
        console.log('Processing index.html for production...');
        let htmlContent = await fs.readFile('index.html', 'utf8');

        // Remove the Babel Standalone script as it's not needed for the pre-transpiled code
        htmlContent = htmlContent.replace('<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>', '<!-- Babel Standalone removed for production build -->');

        // Update the script tag to point to the compiled JavaScript file
        htmlContent = htmlContent.replace(
            '<script type="text/babel" data-type="module" src="./index.tsx"></script>',
            '<script type="module" src="./index.js"></script>'
        );
        
        // Write the processed HTML to the dist directory
        await fs.writeFile(`${distDir}/index.html`, htmlContent, 'utf8');

        console.log('Build finished successfully!');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
