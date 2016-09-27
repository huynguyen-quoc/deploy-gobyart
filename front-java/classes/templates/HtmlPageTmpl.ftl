<!doctype html>
<html ng-app="fuse">
<head>
    <base href="/">
    <meta charset="utf-8">
    <meta name="title" content="{{::siteOption.SITE_NAME}}">
    <meta name="description" content="{{::siteOption.SITE_DESCRIPTION_DESCRIPTION}}">
    <meta name="keywords" content="{{::siteOption.SITE_KEYWORD}}">
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <meta property="og:site_name" content="{{::siteOption.SITE_URL}}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="vi_VN">
    <meta name="ROBOTS" content="INDEX, FOLLOW">
    <title>{{ (!siteOption.page_title) ? siteOption.SITE_NAME : siteOption.page_title }}</title>

    <link rel="stylesheet" href="styles/vendor.css">

    <link rel="stylesheet" href="styles/app.css">

    <link href="//fonts.googleapis.com/css?family=Roboto:400,100,100italic,300,300italic,400italic,500,500italic,700italic,700,900,900italic" rel="stylesheet" type="text/css">
</head>

<!--[if lt IE 10]>
<p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade
    your browser</a> to improve your experience.</p>
<![endif]-->

<body ng-controller="IndexController as vm"
      class="page {{state.current.bodyClass || ''}}">

<!-- SPLASH SCREEN -->
<ms-splash-screen id="splash-screen">
    <div class="center">
        <div class="logo">
            <span>G</span>
        </div>
        <!-- Material Design Spinner -->
        <div class="spinner-wrapper">
            <div class="spinner">
                <div class="inner">
                    <div class="gap"></div>
                    <div class="left">
                        <div class="half-circle"></div>
                    </div>
                    <div class="right">
                        <div class="half-circle"></div>
                    </div>
                </div>
            </div>
        </div>
        <!-- / Material Design Spinner -->
    </div>
</ms-splash-screen>
<!-- / SPLASH SCREEN -->


<div id="main"  ui-view="main" layout="column"></div>


<!--<ms-theme-options></ms-theme-options>-->

<script src="scripts/vendor.js"></script>
<script type="text/javascript">
    $.fn.inView = function(){
        var viewport = {};
        viewport.top = $(window).scrollTop();
        viewport.bottom = viewport.top + $(window).height();
        var bounds = {};
        bounds.top = this.offset().top;
        bounds.bottom = bounds.top + this.outerHeight();
        return ((bounds.top <= viewport.bottom) && (bounds.bottom >= viewport.top));
    };
    <#if context.site_option??>
    window.site_option = "${context.site_option}";
    </#if>
</script>
<script src="scripts/app.js"></script>


</body>
</html>