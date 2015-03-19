// nodejs core
var fs = require('fs')
var url = require('url')
// npm modules
var openassets = require('openassets')
var request  = require('request')
var cliArgs = require("command-line-args")

// api keys
var settings = JSON.parse(fs.readFileSync("settings.json"))
var config = { url: "https://api.chain.com/v2"};

/* define the command-line options */
var cli = cliArgs([
    { name: "help", type: Boolean, description: "Print usage instructions" },
    { name: "words", type: Array, defaultOption: true, description: "sub-commands" }
]);

/* parse the supplied command-line values */
var options = cli.parse();

/* generate a usage guide */
var usage = cli.getUsage({
    header: "A colored coin tool. ccoin <command> <options>",
    footer: "read <transaction id>",
});

if(options.help || !options.words ||
    (options.words && options.words.length == 0)) {
  console.log(usage);
  process.exit()
}
var cmd = options.words.shift()
if(cmd == "read") {
  var txid = options.words.shift()
  console.log('read', txid)
  doRead(txid)
}

function doRead(txid) {
  // Create an instance of the Open Assets ColoringEngine, and pass to
  // it a configured transaction provider
  ce = new openassets.ColoringEngine(getChainTransactionProvider(config));

  // Use the coloring engine to obtain information about a transaction. In
  // this case, get the 0th output of a known Open Assets 'issuance' transaction.
  // The first argument is the hash of the transaction, the 2nd is the index
  // of the output to retrieve, and the third is a callback function that will
  // be populated with the asset ID and asset quantity information, if any, associated with
  // that output.
  ce.getOutput(txid, 0, function (err, data) {

    // If anything went wrong, say so
    if (err) console.log(err.message);

    // Print the asset information as a raw TransactionOutput object
    console.log(data);

    // Use the TransactionOutput.toString() method to get a more readable representation
    console.log(data.toString());
  });
}

function getChainTransactionProvider(config) {
  return function transactionProvider(hash, cb) {
    var api = url.parse(config.url)
    api.auth = settings.key+":"+settings.secret
    api.pathname = api.pathname+"/bitcoin/transactions/"+hash+"/hex"
    request(url.format(api), function(err, resp, body){
      var response = JSON.parse(body)
      cb(err, {result:response.hex}) // body.message body.result
    });
  };
};