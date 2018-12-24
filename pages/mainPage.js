var mainPage = function() {

    this.search = element(by.model("selectedPlace"));
    this.cities = $$("#trending-cities .img-caption>h4");
    this.signInButton = element(by.xpath("//a[text() = 'Sign In']"));
    this.userName = element(by.id("user_login"));
    this.password = element(by.id("user_password"));
    this.loginButton = element(by.id("login_btn"));
    this.loginStatus = element(by.id("login_status"));
    this.closeButton = element(by.xpath("//button[text() = 'Close']"));
    this.searchBox = element.all(by.model("selectedPlace"));
}

module.exports = new mainPage();