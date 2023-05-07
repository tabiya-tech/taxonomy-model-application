import * as fs from "fs";
import * as path from "node:path";
import * as archiver from "archiver";

const schemaFiles = process.argv.slice(2);
const outputDirName = path.resolve("./schemas");
fs.mkdirSync(outputDirName, {recursive: true});

const filesToArchive: string[] =[];
schemaFiles.forEach((schemaFile)=>{
    const exportedObject = require(schemaFile);
    Object.entries(exportedObject).forEach((entry)=>{
        // @ts-ignore
        if ( typeof entry[1] === "object" && (entry[1].$id !== undefined || entry[1].$ref !== undefined ) ){
            const filename = path.join(outputDirName, `${entry[0]}.json`);
            fs.writeFileSync(filename, JSON.stringify(entry[1], undefined, 2));
            filesToArchive.push(filename);
        }
    })
});

createZip(outputDirName, filesToArchive);



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