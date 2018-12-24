var home = require("../pages/mainPage.js");
var data = require("../testData/data.json");

describe("Regression Suite", () => {

    var EC = protractor.ExpectedConditions;
    var pgp = require("pg-promise")(/*options*/);
    var cn = {
        host : 'localhost',
        port :  5432,
        database :  'dvdrental',
        user :  'postgres',
        password :  'abc'
    };

    var db = pgp(cn);
    var arr = [];

    beforeEach(() =>{
        browser.get(data.fourStay.url);
    })

    it("invalidLogin", () => {
        db.any(data.fourStay.sql1).then(result => {
            arr = result;
        }).catch(error => {
            console.log(error)
        }).then(() => {
            arr.forEach(i => {
                browser.wait(EC.elementToBeClickable(home.signInButton), 12000);
                home.signInButton.click();
                home.userName.clear().then(() => {
                    home.userName.sendKeys(i.title);
                });
                home.password.clear().then(() => {
                    home.password.sendKeys(i.title);
                });
                
                browser.wait(EC.elementToBeClickable(home.loginButton), 12000);
                home.loginButton.click();
                expect(home.loginStatus.isDisplayed()).toBe(true);
                browser.wait(EC.elementToBeClickable(home.closeButton), 12000);
                home.closeButton.click();
               

            })
        })
    })

    it("search1", () => {

            home.searchBox.get(0).sendKeys("h");
            home.searchBox.get(0).sendKeys(protractor.Key.ARROW_DOWN);
            home.searchBox.get(0).sendKeys(protractor.Key.ARROW_DOWN);
            home.searchBox.get(0).sendKeys(protractor.Key.ENTER);
            
    })
   

    

    
})
