
      const copyButton = document.getElementById("copy-button");
        const textOutput = document.getElementById("text-output");

        copyButton.addEventListener("click", () => {
            textOutput.select();
            document.execCommand("copy");
            window.getSelection().removeAllRanges(); // deselect the text
        });

        function convertImages() {
            const fileInput = document.getElementById("image-input");
            const textOutput = document.getElementById("text-output");
            const languageSelect = document.getElementById('languageSelect');

            const files = fileInput.files;
            if (files.length === 0) {
                textOutput.value = "Please select one or more image files.";
                return;
            }

            const batchSize = 5; // set batch size to 5 images
            let currentBatch = 0;
            let recognizedText = {};

            function processBatch() {
                let batchFiles = [];
                for (let i = currentBatch * batchSize; i < Math.min(files.length, (currentBatch + 1) * batchSize); i++) {
                    batchFiles.push(files[i]);
                }
                if (batchFiles.length === 0) {
                    // done processing all batches, concatenate and set text output
                    let outputText = "";
                    for (let j = 0; j < files.length; j++) {
                        if (recognizedText[files[j].name]) {
                            outputText += recognizedText[files[j].name] + "\n\n"; // add a line break after each recognized text
                        }
                    }
                    textOutput.value = outputText;
                    return;
                }

                let batchPromises = [];
                for (let i = 0; i < batchFiles.length; i++) {
                    batchPromises.push(
                        new Promise((resolve, reject) => {
                            let reader = new FileReader();
                            reader.readAsDataURL(batchFiles[i]);
                            reader.onload = (event) => {
                                let image = new Image();
                                image.onload = () => {
                                    let canvas = document.createElement('canvas');
                                    canvas.width = image.width;
                                    canvas.height = image.height;
                                    let ctx = canvas.getContext('2d');

                                    // Convert image to grayscale
                                    ctx.filter = 'grayscale(100%)';

                                    // Draw image on canvas and get data URL
                                    ctx.drawImage(image, 0, 0);
                                    let dataURL = canvas.toDataURL();

                                    Tesseract.recognize(dataURL, languageSelect.value)
                                        .then(({ data: { text } }) => {
                                            recognizedText[batchFiles[i].name] = text;
                                            resolve();
                                        })
                                        .catch((error) => {
                                            recognizedText[batchFiles[i].name] = "Error: " + error.message;
                                            resolve();
                                        });
                                };
                                image.src = event.target.result;
                            };
                        })
                    );
                }

                Promise.all(batchPromises).then(() => {
                    let outputText = "";
                    for (let j = 0; j < files.length; j++) {
                        if (recognizedText[files[j].name]) {
                            outputText += recognizedText[files[j].name] + "\n\n"; // add a line break after each recognized text
                        }
                    }
                    textOutput.value = outputText;
                    currentBatch++;
                    let progress = (currentBatch * batchSize / files.length) * 100;
                    document.getElementById("progress-bar").value = progress;
                    if (currentBatch * batchSize < files.length) {
                        setTimeout(processBatch, 10000); // wait 10 seconds before processing next batch
                    }
                });
            }


            processBatch();
        }
