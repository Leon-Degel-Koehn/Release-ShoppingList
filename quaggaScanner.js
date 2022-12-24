function runQuagga() {
    document.getElementById('displayDiv').removeAttribute("hidden");
    Quagga.init({
        inputStream : {
            name : "Live",
            type : "LiveStream",
            target: document.getElementById('displayDiv'), 
        },
        decoder : {
            readers : ["ean_reader", "code_128_reader", "code_39_reader"]
        }
    }, function(err) {
        if (err) {
            console.log(err);
            return
        }
        console.log("Initialization finished. Ready to start");

        Quagga.start();
    });

    Quagga.onDetected((data) => {
    
        Quagga.stop();
        const barcode = data["codeResult"]["code"];
        console.log("detected barcode");
        (async () => {
            let text = await getProductFromCode(barcode);
            if(text.indexOf("Sorry") >= 0)
                alert(text);
            else
                updateWithData(text);
        })();
        document.getElementById('displayDiv').setAttribute("hidden", "");
    });

}





