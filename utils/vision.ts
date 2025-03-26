//integrating Cloud Vision API 
// Loaded $env:GOOGLE_APPLICATION_CREDENTIALS - might have to relaoad again since it is not global


const vision = require('@google-cloud/vision');



const client = new vision.ImageAnnotatorClient();

//function to get labels from image - very straightforward
//async functions return a promise
// why is this async again?
export async function detectlabels(imagePath:string) {
    const [result] = await client.labelDetection(imagePath);
    const labels = result.labelAnnotations;
    console.log('Labels:', labels);
}

// not integrated yet - does after being in the firebase storage right