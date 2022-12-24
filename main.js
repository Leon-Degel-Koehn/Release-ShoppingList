//global variable and constants declarations
let initialData;
let currentData;
let mainTable; 

//inserting testdata into main relation
//todo: wanna do this using the static method from db loadFrom...
let shoppingList = new Relation("shoppingList", 
    ["article", "quantity_need"], 
    [{"article":"Butter","quantity_need":"1"},{"article":"Gummib\u00e4rchen","quantity_need":"1"},{"article":"Toilettenpapier","quantity_need":"5 Rollen"}], 
    "article",
    "https://sheetdb.io/api/v1/a5nfr9b6ucenx");


//elementary function definitions

//handles the updating of data in the visible plain as well as forcing the database to change
function updateData() {

    const currentRow = parseInt(this.id.substr(3, this.id.indexOf('cell')-3));
    const currentCell = parseInt(this.id.substr(this.id.indexOf('cell')+4, this.id.indexOf('input')-this.id.indexOf('cell')+4));
    const insertedValue = this.value;

    const row = document.getElementById(`row${currentRow}`);
    let toInsert = {};

    //make sure that the tuple we are passing as update value does not contain empty values
    for(let i = 0; i < shoppingList.attributes.length; i++) {
        const readVal = document.getElementById(`row${currentRow}cell${i}input`).value;
        if(readVal.length > 0)
            toInsert[shoppingList.attributes[i]] = readVal;
        else {
            console.log('not inserting because of emtpy data cell in row');
            return;
        }
    }

    //if the inserted value was a quantity of 0 we want to delete the row
    if(currentCell === 1 && insertedValue == 0) {
        //we do indeed have a change in the quantity cell to 0

        //passing the identifying primary key value to the database to delete
        shoppingList.delete(document.getElementById(`row${currentRow}cell0input`).value);
        //delete corresponding row from table
        row.remove();

        return;
    }

    //first trying to update any fitting tuple, if no such tuple exists we instead try to insert a new one
    if(!shoppingList.update(toInsert)) {
        if(!shoppingList.insertData(toInsert)) {
            console.log('couldnt insert anything');
        } else {
            console.log("inserted");
        }
    } else {
        console.log('updated');
    }

}

//add a row to the displayed table
function addRow() {
    const rowIndex = mainTable.rows.length;
    let newRow = mainTable.insertRow(rowIndex);
    newRow.id = `row${rowIndex}`;
    let cellArticle = newRow.insertCell(0);
    cellArticle.id = newRow.id + "cell0";
    let cellQuantity = newRow.insertCell(1);
    cellQuantity.id = newRow.id + "cell1";
    
    //create input fields within the newly created table cells
    let inputArticle = document.createElement('input');
    inputArticle.id = cellArticle.id + "input";
    inputArticle.onchange = updateData;
    cellArticle.appendChild(inputArticle);

    let inputQuantity = document.createElement('input');
    inputQuantity.id = cellQuantity.id + "input";
    inputQuantity.onchange = updateData;
    cellQuantity.appendChild(inputQuantity);

    return rowIndex;
}

//take data from the format given from the api and display to the user interface
function displayData(relation) {
    console.log("displaying");
    let mainDiv = document.getElementById('mainDiv');

    //resetting main div content before display
    mainDiv.innerHTML = '';

    mainTable = document.createElement('table');
    mainTable.id = "mainTable";
    let firstRow = document.createElement('tr');
    firstRow.id = "row0";
    const attributeRenaming = ["Artikel", "Anzahl"];
    for(let i = 0; i < relation.attributes.length; i++) {
        let td = document.createElement('td');
        td.id = `row0cell${i}`;
        //td.innerHTML = relation.attributes[i];
        td.innerHTML = attributeRenaming[i]; //this is just for displaying the stuff in german, usually I wouldnt do this an this might also not be the best practice of going about this
        firstRow.appendChild(td);
    }
    mainTable.appendChild(firstRow);

    for(let y = 0; y < relation.data.length; y++) {
        let nextRow = document.createElement('tr');
        nextRow.id = `row${y+1}`;
        for(let x = 0; x < relation.attributes.length; x++) {
            let td = document.createElement('td');
            td.id = nextRow.id + `cell${x}`;
            let inElem = document.createElement('input');
            inElem.id = td.id + 'input';
            inElem.value = relation.data[y][relation.attributes[x]];
            inElem.onchange = updateData;
            td.appendChild(inElem);
            nextRow.appendChild(td);
        }
        mainTable.appendChild(nextRow);
    }

    //blitting new content into div
    mainDiv.appendChild(mainTable);
}

//displayData(shoppingList);

//first function that is executed in the program, we fetch the data from the db and display it on screen
(async () => {
    shoppingList = await Relation.loadDataFromSheetDB("shoppingList", "article", "https://sheetdb.io/api/v1/a5nfr9b6ucenx");
    displayData(shoppingList);
})();

document.getElementById('btnAddRow').onclick = addRow;

function updateWithData(productName) {
    if(shoppingList.contains(productName)) {
        alert("Produkt doch schon laengst in der Liste, hast du Tomaten auf den Augen?");
        return;
    }
    let addedRow = addRow();
    document.getElementById(`row${addedRow}cell0input`).value = productName;
    document.getElementById(`row${addedRow}cell0input`).value = '1';
    //returns nothing could return true or something for success but then we need to check if this is actually successful
}

