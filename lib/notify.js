'use strict';

const Handlebars = require('handlebars');
const request = require('request');
const Logger = require('./logger');

const handleNotify = function(metadata, notifyEntry) {
  let regex;
  if (metadata.name && notifyEntry.packagePattern) {
    regex = new RegExp(notifyEntry.packagePattern, notifyEntry.packagePatternFlags || '');
    if (!regex.test(metadata.name)) {
      return;
    }
  }

  const template = Handlebars.compile(notifyEntry.content);
  const content = template( metadata );

  const options = {body: content};

  // provides fallback support, it's accept an Object {} and Array of {}
  if (notifyEntry.headers && Array.isArray(notifyEntry.headers)) {
    const header = {};
    notifyEntry.headers.map(function(item) {
      if (Object.is(item, item)) {
        for (const key in item) {
          if (item.hasOwnProperty(key)) {
              header[key] = item[key];
          }
        }
      }
    });
    options.headers = header;
  } else if (Object.is(notifyEntry.headers, notifyEntry.headers)) {
    options.headers = notifyEntry.headers;
  }

  options.method = notifyEntry.method;

  if ( notifyEntry.endpoint ) {
    options.url = notifyEntry.endpoint;
  }

  request(options, function(err, response, body) {
    if (err) {
      Logger.logger.error({err: err}, ' notify error: @{err.message}' );
    } else {
      Logger.logger.info({content: content}, 'A notification has been shipped: @{content}');
      if (body) {
        Logger.logger.debug({body: body}, ' body: @{body}' );
      }
    }
  });
};

module.exports.notify = function(metadata, config) {
  if (config.notify) {
    if (config.notify.content) {
      handleNotify(metadata, config.notify);
    } else {
      for (const key in config.notify) {
        if (config.notify.hasOwnProperty(key)) {
          handleNotify(metadata, config.notify[key]);
        }
      }
    }
  }
};
