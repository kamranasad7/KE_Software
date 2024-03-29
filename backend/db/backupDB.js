import Backup from 'backup-mongodb';
import config from "../config.js";

function getDateString() {
	
	//helper function to get a date string in the specified format
	//day_month_year.hour.minute.second

	const date = new Date();
	const year = date.getFullYear() + "";
	
	return date.getDate() + "-" + (date.getMonth() + 1) + "-" + year.charAt(2) + year.charAt(3) + "::" + date.getHours() + ":" + date.getMinutes() + ":" + date.getUTCSeconds();
}

const backupDB = () => {

    const dbUri = `${config.mongoUrl}/${config.dbName}`
    const basePath = 'backup'
    
    try{
        new Backup(dbUri, basePath).backup();
        return getDateString();
    }
    catch(e){
        console.log(e)
        return 500;
    }

}

export default backupDB
