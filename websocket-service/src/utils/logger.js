const winston = require("winston");
/*What is Winston?

Winston is a multi-transport logging library. Instead of just printing text to a screen, it can intelligently route your server's thoughts to different places at the same time:

The Console: For you to see while coding.

A File: (e.g., combined.log) to keep a history of everything.

An Error File: (e.g., error.log) to specifically catch only the stuff that broke.

Cloud Services: Sending logs to external monitoring tools.*/

// Create logger
const logger = winston.createLogger({

  level: "info",
  /* This tells Winston: "Record everything from info level and higher (like warn and error)."
   It keeps your logs from getting cluttered with tiny debug details that you don't need to see every day.*/

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  transports: [

    // Console logging
    new winston.transports.Console(),

    // Info logs file
    new winston.transports.File({
      filename: "logs/app.log"
    }),

    // Error logs file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error"
    })

  ]

});

module.exports = logger;