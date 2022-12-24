async function getProductFromCode(barcode) {
    let successfulResponse = true;
    //nach q= kommt der barcode
    let text = await fetch(`https://api.codetabs.com/v1/proxy?quest=https://go-upc.com/search?q=${barcode}`)
    .then(response => {
        if(!response.ok) {
            throw Error(response.status);
        }
        return response;
    })
    .then((response) => response.text())
    .catch(error => {
        successfulResponse = false;
        console.log("There has been a problem while querying the product db. Please check proxy and db. The error was", error.message);
    });
    let myRegex = /<h1.*class="product-name".*>/;
    if(text.indexOf("Sorry, we were not able to find a product") >= 0 || !successfulResponse)
        return "leider ein unbekannter Artikel";
    let res = text.match(myRegex)[0];
    let ind1 = res.indexOf('>');
    text = res.substring(ind1+1, res.indexOf('<', ind1));
    return text;
}