import { MongoClient } from "mongodb";
import config from "./config.js";
import CustomerModel from "./models/customer.model.js";
import InstallmentModel from "./models/installment.model.js";
const client = new MongoClient(config.mongoUrl)
let database = {};

const initialize = async () => {
  try {
    await client.connect();
    database = await client.db(config.dbName);
    console.log("Connection established")
    createCollection("accounts")
    createCollection("customers")
    createCollection("InstallmentRecord")
    createCollection("inventory")
    createCollection("users")

    updateCustomerStatus()

  }
  catch (e) {
    console.log(e);
  }
}

const collectionExist = async (collectionName) => {
  const collectionsList = await client.db("KE").listCollections({}, { nameOnly: true });
  let AllcollectionNames = []

  collectionsList.forEach(element => {
    AllcollectionNames.push(element.name);
  });

  const index = AllcollectionNames.indexOf(collectionName)
  return (index == -1) ? false : true;
}

const createCollection = async (collectionName) => {

  if (!collectionExist(collectionName)) {
    await database.createCollection(collectionName)
    console.log("Collection created")
  }
  else {
    console.log("Collection already exist")
  }

}

const getUserCredential = async (userName) => {

  try {
    const u = await database.collection("users").find({ "userName": `${userName}` }).toArray()
    if (u) {
      return u[0]["password"]
    }
  }
  catch (e) {
    console.log(e)
  }

}

const updateCustomerStatus = async () => {

  const localDate = new Date().getDate();
  const localMonth = new Date().getMonth();
  const localYear = new Date().getFullYear();

  const yearRecord = await InstallmentModel.find({ year: localYear })
  let prevMonthData;
  const currentMonthData = yearRecord[0].months[localMonth]

  if (localMonth != 0) {
    prevMonthData = yearRecord[0].months[localMonth - 1]
  }
  else {
    let temp = localYear - 1
    const prevYearRecord = await InstallmentModel.find({ year: temp })
    prevMonthData = prevYearRecord[0].months[11]
  }

  let paymentReceived = false
  const currentCustomers = await CustomerModel.find({ status: 'current' })

  currentCustomers.forEach(async c => {

    if (currentMonthData != null) {
      for (let i = 0; !paymentReceived && i < localDate; i++) {
        if(currentMonthData.dailyRecord[i] != null){
          const customersRecord = currentMonthData.dailyRecord[i].customerRecord
          for (let j = 0; !paymentReceived && j < customersRecord.length; j++) {
  
            if (customersRecord[j].customer.equals(c._id)) {
              paymentReceived = true
            }
          }
        }
        
      }
    }

    if (prevMonthData != null) {
      for (let i = prevMonthData.length - 1; !paymentReceived && i > localDate; i--) {
        if(prevMonthData.dailyRecord[i] != null){
          const customersRecord = prevMonthData.dailyRecord[i].customerRecord
          for (let j = 0; !paymentReceived && j < customersRecord.length; j++) {
  
            if (customersRecord[j].customer.equals(c._id)) {
              paymentReceived = true
            }
          }
        }
        
      }
    }
    if (!paymentReceived) {
      await CustomerModel.findOneAndUpdate({ _id: c._id }, { status: "defaulter" })
    }

  })

}

export default {
  initialize,
  getUserCredential,
  updateCustomerStatus
};