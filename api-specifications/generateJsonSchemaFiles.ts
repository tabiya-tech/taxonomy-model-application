import * as fs from "fs";
import * as path from "node:path";
import * as archiver from "archiver";

const schemaFiles = process.argv.slice(2);
const outputDirName = path.resolve("./schemas");
fs.mkdirSync(outputDirName, {recursive: true});

const filesToArchive: string[] =[];
schemaFiles.forEach((schemaFile)=>{
    const exportedObject = require(schemaFile);
    findSchemasRecursive(exportedObject);
});

createZip(outputDirName, filesToArchive);

function findSchemasRecursive(object: any){
    Object.entries(object).forEach((entry)=>{
        const currentEntry = entry[1] as any;
        if ( typeof currentEntry === "object" && (currentEntry.$id !== undefined || currentEntry.$ref !== undefined ) ){
            const filename = path.join(outputDirName,`${currentEntry.$id.substring(1).replace(/\//g, ".")}.json`);
            fs.writeFileSync(filename, JSON.stringify(currentEntry, undefined, 2));
            filesToArchive.push(filename);
        }else if ( typeof currentEntry === "object" ){
            findSchemasRecursive(currentEntry);
        }
    })
}
function createZip(outputDirName: string, filesToArchive: string[]){
//create a file to stream archive data to
    const output = fs.createWriteStream(path.join(outputDirName + '/schema-archive.zip'));
    const archive = archiver.create('zip', {
        zlib: { level: 9 }
    });

//callbacks
    output.on('close', () => {
        console.log('Archive finished.');
    });

    archive.on('error', (err:any) => {
        throw err;
    });

// pipe and append files
    archive.pipe(output);
    filesToArchive.forEach((file)=>{
        const name = path.basename(file);
        archive.append(fs.createReadStream(file), { name: name });

    })
// finalize
    archive.finalize();
}