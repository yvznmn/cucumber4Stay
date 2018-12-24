var home = require("../pages/mainPage.js");
var data = require("../testData/data.json");

describe("smokeSuite", () => {

    beforeAll(() =>{
        browser.get(data.fourStay.url);
    })
    it("search1", () => {

        home.searchBox.get(0).sendKeys("h");
        home.searchBox.get(0).sendKeys(protractor.Key.ARROW_DOWN);
        home.searchBox.get(0).sendKeys(protractor.Key.ARROW_DOWN);
        home.searchBox.get(0).sendKeys(protractor.Key.ENTER);
        
    })
})

