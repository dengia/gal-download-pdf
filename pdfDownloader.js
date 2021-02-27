const axios = require('axios')
const fs = require('fs')
const path = require('path')

function downloadToBase64(url) {
  const filePathBase64 = path.resolve(__dirname, 'pdfs', 'good_services_1.pdf.base64.txt')
  const filePathPdf = path.resolve(__dirname, 'pdfs', 'good_services_1_fromBase64.pdf')

  return axios({ url, method: 'GET', responseType: 'stream' })
    .then(response => {
      return new Promise((resolve, reject) => {

        //Response.data is a stream
        const readableStream = response.data

        //Byte array
        const byteArrayFromStream = []

        readableStream.on('readable', () => {
          //Fill byteArray from stream on every 'readable' event. Event is triggered by
          //node.js code, we just 'listen' to events
          let chunk;
          while (null !== (chunk = readableStream.read())) {
            byteArrayFromStream.push(chunk);
          }
        });
        
        readableStream.on('end', () => {
          //When stream ends node.js fires 'end' event so we're explicitly notified
          //about end

          //Concat byteArray into Buffer type and 'encode' buffer into base64 string
          const contentBase64 = Buffer.concat(byteArrayFromStream).toString('base64') 

          //Write base64 string to file for inspection
          fs.writeFileSync(filePathBase64, contentBase64)

          //Convert base64 string back into byte array and write to disk
          let byteArrayFromBase64 = Buffer.from(contentBase64, 'base64');
          fs.writeFileSync(filePathPdf, byteArrayFromBase64);

          //Tell caller the promise is resolved
          resolve(true)
        });

        readableStream.on('error', error => {
          //Tell caller the promise has been rejected
          reject(error)
        });
      })
    })
    .catch(reason => {
      console.log('reason: ', reason)
      return new Promise((resolve, reject) => {
        //Tell caller the promise has been rejected
        reject(reason.response.status + ' - ' + reason.response.statusText) //This is error so Promis should never get resolved --> reject it!
      })
    })
}

//Call
downloadToBase64('https://typless-public.s3-eu-west-1.amazonaws.com/use_cases/metadata-invoice/good_services_1.pdf')
  .then(resolved => console.log('Download base64 completed'))
  .catch(reason => console.log('Error during download base64, details: ', reason))
