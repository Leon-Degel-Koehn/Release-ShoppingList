function handleUpdateErrors(response) {
    if (!response.ok) {
        throw Error(resonse.status);
    }
    return response;
}

class Relation {
    constructor(name = "null", attributes = [], data = [], primaryKey = "null", webLink = "null") {
        this.attributes = attributes;
        this.data = data;
        this.primaryKey = primaryKey;
        this.name = name;
        //specifically only supporting sheetdb weblinks here
        this.webLink = webLink;
    }

    //fill the data attribute of this relation with the contents from the actual database
    static async loadDataFromSheetDB(name, primaryKey, webLink) {
        let res = new Relation(name, [], [], primaryKey, webLink);
        await SheetDB.read(webLink, {}).then((result) => {
                res.data = result;
                console.log('successfully imported database');
            }, (error) => {
                console.log(error, "occured while loading database");
            }
        );
        
        //get attributes from db
        await SheetDB.read(webLink + '/keys', {}).then((result) => {
            res.attributes = result;
            console.log('successfully imported attributes from db');
        }, (error) => {
            console.log(error, 'failed to load attributes of db');
        });

        //return created relation
        return res;

    }

    //returns the index at which the tuple is located that contains the desired value for the primary key
    find(primaryKeyValue) {
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i][this.primaryKey] === primaryKeyValue) return i;
        }
        return -1;
    }

    //check if a tuple with the passed primaryKey value exists in the relation
    contains(primaryKeyValue) {
        return this.find(primaryKeyValue) >= 0;
    }

    //returns true if we successfully insert the tuple, false otherwise
    //this function should insert a new tuple into the table it won't update an existing one
    //TODO: check this function... why is tuplePrimaryKey not being used?
    insertData(datasetTuple) {
        //check if the datasetTuple contains a valid primary key
        let tuplePrimaryKey;
        if(this.primaryKey in datasetTuple) {
            tuplePrimaryKey = datasetTuple[this.primaryKey];
        } else {
            return false;
        }

        //check if our relation does indeed not have that value assigned to a primary key attribute yet
        if(!this.contains(datasetTuple[this.primaryKey])) {
            this.data.push(datasetTuple);

            SheetDB.write(this.webLink, {'data' : datasetTuple}).then(result => {
                //check here if we get a successful response
                if(!('created' in result && result['created'] >= 1)) {
                    alert('tried to insert data into the online db but failed');
                    return;
                }

                console.log(`managed to create ${result['created']} rows in online db`);
            });
            //return upon succesful insertion into the database
            return true;
        } else {
            return false;
        }
    }

    //update an existing tuple
    //return true if the operation was successful
    update(datasetTuple) {

        //check that the dataset has set the key for the primary ke
        if(!this.primaryKey in datasetTuple) return false;

        //check if datasetTuple does indeed have a primary key that already exists
        let toUpdateIndex = this.find(datasetTuple[this.primaryKey]);
        if(toUpdateIndex < 0) return false; //no such tuple in the database, usually we will then insert instead

        //update database entry
        this.data[toUpdateIndex] = datasetTuple;

        //definitions of the format that the online database expects
        //we identify the column that represents out primary key as well as the value of the primary key for which tuples in the database should be updated
        const column = this.primaryKey;
        const keys = datasetTuple[this.primaryKey];

        //there is no pre-implemented method like SheetDB.write for this operation, so we do it manually with a request
        fetch(this.webLink + `/${column}/${keys}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "data": [datasetTuple]
            })
        })
        .then(handleUpdateErrors)
        .then(response => {
            return response.json();
        }).then(data => console.log(data))
        .catch(error => {
            switch (error.message) {
                case '400': 
                    alert('DB API didnt understand update request, aborting');
                    break;
                case '401':
                    alert('A problem occured during authentication, please check the credentials');
                    break;
                case '429':
                case '402':
                    alert('The maximum amount of database updates has occured this month, further payment needed');
                    break;
                case '403':
                    alert('Aborting update operation, because an illegal update was about to be made');
                    break;
                case '404':
                    alert('Somehow the server couldnt find the database online');
                    break;
                case '500':
                    alert('Die Server auf denen die Einkaufsliste läuft haben gerade ein Problem, wartet ein bisschen');
                    break;
                case '1015':
                    alert('WTF du bist viel zu schnell mit deinen Einträgen, warte bitte 1 Minute, das Programm kommt nicht hinterher');
                    break;
                default:
                    alert('Ein unbekannter Fehler ist aufgetreten beim Update der Datenbank, einmal Leon bescheidgeben bitte');
                    break;
            }
            return false;
        });

        //return upon successful update of the database
        return true;
    }

    //delete tuple from database which has the given primaryKeyValue
    //return true if the operation was successful
    //TODO: incorporate the delete on the online database
    delete(primaryKeyValue) {
        let index = this.find(primaryKeyValue);
        if(index < 0) return false; //no such tuple in the database
        this.data.splice(index,1);

        fetch(this.webLink + `/${this.primaryKey}/${primaryKeyValue}`, {
            method: 'DELETE'
        })
        .then(response => {
            if(!response.ok)
                console.log("something went wrong with delete");
            return response.json();
        }).then(data => console.log(data));

        return true;
    }

    //getters
    get rows() {
        return this.data.length;
    }

    get columns() {
        return this.attributes.length;
    }

}
