export default class DBManager {
    constructor() {        
        window.sql.askForConnect().then((connection) => {
            this.db = connection;
        });
    }    
}