Social Enterprise Directory

How to use (for all versions):
- Make sure you have an instance of mongodb running
- npm install -d
- bower install
- node app.js
- Point your browser to [http://localhost:3000](http://localhost:3000)

To run the tests, install mocha `npm -g mocha` and then run `mocha`. The tests are focusing on the public-facing API that will be used to render content on the website (since that would have a huge impact if it were to go down)

Uses Azure Search for search and typeahead service. Will silently fail if Azure Search is not configured. You can get free basic search with Azure Search (50Mb, 10 000 documents). Follow those instructions [http://azure.microsoft.com/en-us/documentation/articles/search-configure/] and then fill the api-key and URL host inside config.js