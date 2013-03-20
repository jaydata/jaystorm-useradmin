function getInternetExplorerVersion() {
    if (navigator.appName == 'Microsoft Internet Explorer') {
        var ua = navigator.userAgent;
        var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null)
            return parseFloat(RegExp.$1);
    }
    return -1;
}
function slideclick(e, element) {
    e.preventDefault();
    document.getElementById("welcome").style.display = "none";
    $(".nav a#" + element.getAttribute("id") + "").trigger("click");
}

var ver = getInternetExplorerVersion();
if (ver > -1) {
    if (ver < 10.0)
        alert('Please upgrade to Internet Explorer 10 or use another browser, this function does not work with your Internet Explorer version!');
}

$("ul.nav > li > a").live('click', function () {
    var $parent = $(this).parent();

    $parent.parent().find("li.active").removeClass("active");
    $parent.addClass("active");
});

$(".sub-navbar a").live('click', function () {
    $("div.navbar ul.nav li.active").removeClass("active");
});

$(function () {
    // MENU ITEMS
    var menuItems = document.body.querySelectorAll("ul.nav li a"),
        welcome = document.getElementById("welcome");

    for (var i = 0; i < menuItems.length; i++) {
        menuItems[i].addEventListener("click", function () {
            var scrollTo = parseInt(this.getAttribute("id"));
            welcome.style.display = "none";
        }, false);
    }

    if (location.href.indexOf("dev-") >= 0) {
        $("#logo-jaystorm").after("<span class='logo-beta'>&nbsp;</span>");
    }
});