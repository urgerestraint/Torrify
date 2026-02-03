const fs = require('fs')
const path = require('path')

const distDir = path.join(__dirname, 'dist-electron')

// Recursively find all .js files in dist-electron
function findJsFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) {
    return files
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findJsFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath)
    }
  }
  return files
}

// First pass: rename all .js files to .cjs
const jsFiles = findJsFiles(distDir)
let hadError = false

for (const jsFile of jsFiles) {
  const cjsFile = jsFile.replace(/\.js$/, '.cjs')
  
  try {
    // Remove the old .cjs file if it exists
    if (fs.existsSync(cjsFile)) {
      fs.unlinkSync(cjsFile)
    }
    
    // Rename the file
    fs.renameSync(jsFile, cjsFile)
  } catch (error) {
    hadError = true
    console.error(`Failed to rename ${jsFile}:`, error)
  }
}

// Second pass: update require paths in all .cjs files
function findCjsFiles(dir) {
  const files = []
  if (!fs.existsSync(dir)) {
    return files
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findCjsFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.cjs')) {
      files.push(fullPath)
    }
  }
  return files
}

const cjsFiles = findCjsFiles(distDir)

for (const cjsFile of cjsFiles) {
  try {
    let content = fs.readFileSync(cjsFile, 'utf-8')
    const fileDir = path.dirname(cjsFile)
    
    // Update require paths from local imports
    content = content.replace(
      /require\("(\.\.?\/[^"]+)"\)/g,
      (match, importPath) => {
        // Skip if already has .cjs or .json extension
        if (importPath.endsWith('.cjs') || importPath.endsWith('.json')) {
          return match
        }
        
        // Resolve the import path relative to the current file
        const resolvedPath = path.resolve(fileDir, importPath)
        
        // Check if it's a directory (index import)
        if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
          // It's a directory, so it imports index.cjs
          return `require("${importPath}/index.cjs")`
        }
        
        // Check if the .cjs file exists
        if (fs.existsSync(resolvedPath + '.cjs')) {
          return `require("${importPath}.cjs")`
        }
        
        // Fallback: just add .cjs
        return `require("${importPath}.cjs")`
      }
    )
    
    // Write the updated content
    fs.writeFileSync(cjsFile, content, 'utf-8')
    
  } catch (error) {
    hadError = true
    console.error(`Failed to update requires in ${cjsFile}:`, error)
  }
}

if (hadError) {
  process.exitCode = 1
}
