require('../utilities/ngClick.js');

var bestOffersPage = function() {

    this.bestOffer = element(by.css(".page-area h1"));
    this.allignmentOfBestOffer = this.bestOffer.getCssValue('text-align');
}

module.exports = new bestOffersPage();