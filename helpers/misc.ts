import fs from "fs";

const contractsDir = "./contracts.json";

export interface iContractData {
  title: string,
  address: string,
  description: string
};

export async function resetJsonFile() {
  if (fs.existsSync(contractsDir)) {
    fs.unlinkSync(contractsDir);
  }
}

export function saveToJson(data: iContractData) {

  // current json array

  if (!fs.existsSync(contractsDir)) {
    const newArr = [data];
    const dataStringified = JSON.stringify(newArr);
    fs.writeFileSync(contractsDir, dataStringified);
  } else {
    // get json
    const dataString = JSON.parse(fs.readFileSync("./contracts.json", "utf8"));
    // push new data
    dataString.push(data)
    // stringify array
    const dataStringified = JSON.stringify(dataString);
    // write
    fs.writeFileSync(contractsDir, dataStringified);
  }
}

// works but not appending
// export function saveToJson(data: iContractData) {
//   const contractsDir = "./contracts.json"

//   const dataStringified = JSON.stringify(data);

//   fs.writeFileSync(contractsDir, dataStringified);

//   // const dataString = fs.readFileSync("./contracts.json", "utf8");
//   // console.error("dataString", dataString);
// }

export async function readJson(title: string) {
  try {
      const dataParsed = JSON.parse(fs.readFileSync("./contracts.json", "utf8"));
      const object = dataParsed.find((obj: any) => obj.title === title); 
      return object
  } catch (err) {
      console.error(err);
      return false
  }
}

export async function readJsonByDesc(description: string) {
  try {
      const dataParsed = JSON.parse(fs.readFileSync("./contracts.json", "utf8"));
      const objects = dataParsed.filter((obj: any) => obj.description === description); 
      return objects
  } catch (err) {
      console.error(err);
      return false
  }
}
