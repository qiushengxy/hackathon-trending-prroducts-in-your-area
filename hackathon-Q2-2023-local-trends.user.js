// $Revision: #8 $

// ==UserScript==
// @name           Hackathon Q2 2023 - Local Trends
// @version 1
// @description    add additional information to buy box / detail page
// @include        http*://*.amazon.com/*/dp/*
// @grant         GM.xmlHttpRequest
// @grant       GM_xmlhttpRequest
// @connect     os-dashboard.prod.bolts-locality-opensearch.dex.amazon.dev
// @resource   IMPORTED_CSS https://cdnjs.cloudflare.com/ajax/libs/tingle/0.8.4/tingle.min.css
// @grant      GM_getResourceText
// @grant      GM_addStyle
// @require https://cdnjs.cloudflare.com/ajax/libs/aws-sdk/2.1379.0/aws-sdk.min.js
// ==/UserScript==

// AWS S3 configuration
const bucketName = 'your-s3-bucket-name';
const accessKeyId = 'your-access-key-id';
const secretAccessKey = 'your-secret-access-key';
const region = 'your-aws-region';

// Add jQuery
var GM_JQ = document.createElement('script');
GM_JQ.src = 'https://code.jquery.com/jquery-3.5.1.slim.min.js';
GM_JQ.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(GM_JQ);

// Add tingle (modals)
var GM_TINGLE = document.createElement('script');
GM_TINGLE.src = 'https://cdnjs.cloudflare.com/ajax/libs/tingle/0.8.4/tingle.min.js';
GM_TINGLE.type = 'text/javascript';
document.getElementsByTagName('head')[0].appendChild(GM_TINGLE);

// Check if jQuery's loaded
function GM_wait() {
    'use strict';
    const my_css = GM_getResourceText("IMPORTED_CSS");
    GM_addStyle(my_css);
    if (typeof unsafeWindow.jQuery == 'undefined' || typeof unsafeWindow.tingle == 'undefined') {
        window.setTimeout(GM_wait, 100);
    } else {
        tingle = unsafeWindow.tingle;
        $ = unsafeWindow.jQuery; letsJQuery();
    }
}
GM_wait();

// function parsePrimaryDelivery(text) {
//     const DELIVERY_MESSAGE_DIV_ID ="mir-layout-DELIVERY_BLOCK-slot-DELIVERY_MESSAGE";
//     const UPSELL_DELIVERY_MESSAGE_DIV_ID ="mir-layout-DELIVERY_BLOCK-slot-UPSELL";
//     const PRIMARY_DELIVERY_MESSAGE_DIV_ID = "mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE";
//     const SECONDARY_DELIVERY_MESSAGE_DIV_ID = "mir-layout-DELIVERY_BLOCK-slot-SECONDARY_DELIVERY_MESSAGE_LARGE";
//     var DATE_REGEXP = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]*)/i;

//     // match the html TODO: make sure this generalizes, tested with https://tiny.amazon.com/1hu3w458d/amazSYLVdpB08Href
//     var primaryDeliveryText = $("#"+PRIMARY_DELIVERY_MESSAGE_DIV_ID + " b", text).text();
//     if (!primaryDeliveryText) {
//         primaryDeliveryText = $("#"+DELIVERY_MESSAGE_DIV_ID + " b", text).text();
//     }
//     if (!primaryDeliveryText) {
//         return null
//     }
//     primaryDeliveryText = primaryDeliveryText.replace(/(\r\n|\n|\r)/gm, "");
//     var match = DATE_REGEXP.exec(primaryDeliveryText);
//     // console.log("Matched date", match);
//     if (match != null) {
//         var dateStr = match[2] + " " + match[3] + ", " + new Date().getFullYear();
//         return new Date(dateStr);
//     }
//     return null;
// };

function getPrimaryDelivery(text) {
    // match the html TODO: make sure this generalizes, tested with https://tiny.amazon.com/1hu3w458d/amazSYLVdpB08Href
    var primaryDeliveryText = $("#mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE", text).html();
    if (!primaryDeliveryText) {
        primaryDeliveryText = $("#mir-layout-DELIVERY_BLOCK-slot-DELIVERY_MESSAGE", text).html();
    }
    // console.log("parsing delivery as ", primaryDeliveryText);
    return primaryDeliveryText;
};

// function parseSecondaryDelivery(text) {
//     const DELIVERY_MESSAGE_DIV_ID ="mir-layout-DELIVERY_BLOCK-slot-DELIVERY_MESSAGE";
//     const UPSELL_DELIVERY_MESSAGE_DIV_ID ="mir-layout-DELIVERY_BLOCK-slot-UPSELL";
//     const PRIMARY_DELIVERY_MESSAGE_DIV_ID = "mir-layout-DELIVERY_BLOCK-slot-PRIMARY_DELIVERY_MESSAGE_LARGE";
//     const SECONDARY_DELIVERY_MESSAGE_DIV_ID = "mir-layout-DELIVERY_BLOCK-slot-SECONDARY_DELIVERY_MESSAGE_LARGE";
//     var DATE_REGEXP = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) ([0-9]*)/i;

//     // match the html TODO: make sure this generalizes, tested with https://tiny.amazon.com/1hu3w458d/amazSYLVdpB08Href
//     var secondaryDeliveryText = $("#"+SECONDARY_DELIVERY_MESSAGE_DIV_ID + " b", text).text();
//     if (!secondaryDeliveryText) {
//         secondaryDeliveryText = $("#"+UPSELL_DELIVERY_MESSAGE_DIV_ID + " b", text).text();
//     }
//         if (!secondaryDeliveryText) {
//         secondaryDeliveryText = $("#"+UPSELL_DELIVERY_MESSAGE_DIV_ID + " span.a-text-bold", text).text();
//     }
//     if (!secondaryDeliveryText) {
//         return null
//     }
//     // console.log("SECOND TEXT BEFORE", secondaryDeliveryText);
//     secondaryDeliveryText = secondaryDeliveryText.replace(/(\r\n|\n|\r)/gm, "");
//     // console.log("SECOND TEXT AFTER", secondaryDeliveryText);
//     var match = DATE_REGEXP.exec(secondaryDeliveryText);
//     // console.log("Matched date", match);
//     if (match != null) {
//         var dateStr = match[2] + " " + match[3] + ", " + new Date().getFullYear();
//         return new Date(dateStr);
//     }
//     if (secondaryDeliveryText.includes("Today") || secondaryDeliveryText == "Today") {
//         return secondaryDeliveryText;
//     } else if (secondaryDeliveryText.includes("Tomorrow") || secondaryDeliveryText == "Tomorrow") {
//         return secondaryDeliveryText;
//     } else if (secondaryDeliveryText.includes("Overnight") || secondaryDeliveryText == "Overnight") {
//         return secondaryDeliveryText;
//     }
//     return null;
// };

function parseImage(text) {
    var imgsrc = $("#imgTagWrapperId img", text).attr('src');
    // console.log("parsing image source as ", imgsrc);
    return imgsrc;
}

function parseTitle(text) {
    var title = $("#productTitle", text).text();
    // console.log("parsing image title as ", title);
    return title;
}

function parsePrice(text) {
    var price = $(".apexPriceToPay > span", text).text();
    //console.log("parsing price as ", price);
    //return price;
    return ""; //hide price as there is no consistent way to get the price
}

function getDetailPageGL(asin) {
    var glString = $("#wayfinding-breadcrumbs_feature_div").find(".a-color-tertiary").text();
    var productGL = "Toys"; // default to Toys as this performs the best
    if (glString.includes("Sports & Outdoors")) {
        productGL = "Sports";
    } else if (glString.includes("Home")) {
        productGL = "Home";
    } else if (glString.includes("Garden")) {
        productGL = "Lawn and Garden";
    }

    return productGL;
}

// function fetchPrimaryDelivery(alt, callback) {
//     var url = alt.url;
//     // console.log("Making GET request to " + url);
//     setTimeout(function(){
//         GM.xmlHttpRequest({
//             method: 'GET',
//             url: url,
//             onload: function( transport ) {
//                 // console.log("Got status " + transport.statusText + " for " + url);
//                 alt.delivery = parsePrimaryDelivery(transport.responseText);
//                 alt.secondaryDelivery = parseSecondaryDelivery(transport.responseText);
//                 alt.imgsrc = parseImage(transport.responseText);
//                 // console.log("Found other option promises", alt.label, alt.delivery, alt.imgsrc);

//                 callback(alt);
//             },
//         });
//     },1);
// }

function fetchDetails(asin, callback) {
    var url = `https://www.amazon.com/dp/${asin}/`;
    var alt = { asin: asin, url: url };
    // console.log("Making GET request to " + url);
    setTimeout(function () {
        GM.xmlHttpRequest({
            method: 'GET',
            url: url,
            onload: function (transport) {
                // console.log("Got status " + transport.statusText + " for " + url);
                // console.log("Got response: " + transport.responseText);
                alt.title = parseTitle(transport.responseText);
                alt.imgsrc = parseImage(transport.responseText);
                alt.delivery = getPrimaryDelivery(transport.responseText);
                alt.price = parsePrice(transport.responseText);
                // alt.secondaryDelivery = parseSecondaryDelivery(transport.responseText);
                // console.log("Found other option promises", alt.label, alt.delivery, alt.imgsrc);
                callback(alt);
            },
        });
    }, 1);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// const asinLists = {
//     "95008": ["B071D4DKTZ", "B01M0GB8CC", "B08R6S1M1K", "B07QXV6N1B", "B00NKYYMAW", "B07SHFPD8S", "B09JB8KPNW", "B06ZYRCP2B", "B09Z6Q2MLC", "B01FWAZEIU"]
// }

// function getAsinListForLocation(location) {
//     // Get postal.
//     let postal = location.match(/\d+/g)[0];
//     let asinList = asinLists[postal];
//     console.log(`Asin list for postal ${postal} is ${asinList}`);
//     return asinList;
// }

function parseAsinList(response) {
    let parsed = JSON.parse(response);
    // aggregations / asins / buckets / key
    let asins = [];
    parsed.aggregations.asins.buckets.forEach(function (bucket) {
        asins.push(bucket.key);
    })
    console.log(`ASIN List is ${asins}`);
    return asins;
}

// const osDomain = "https://vpc-bolts-locality-opensearch-mp5xxwq5rhnywo33feroatxpye.us-east-1.es.amazonaws.com/";
const osDashURL = 'https://os-dashboard.prod.bolts-locality-opensearch.dex.amazon.dev/_dashboards/api/console/proxy?path=%2Fdexai-locality-quality-2023-04-*%2F_search&method=GET';

var stateTermsQuery = {
    "query": {
        "bool": {
            "must": {
                "match_all": {}
            },
            "filter": [
                {
                    "term": {
                        "to_state": "FL"
                    }
                },
                {
                    "term": {
                        "product_group_desc": "Apparel"
                    }
                },
                {
                    "term": {
                        "marketplace_id": 1
                    }
                }
            ]
        }
    },
    "size": 0,
    "aggs": {
        "asins": {
            "terms": {
                "field": "asin"
            }
        }
    }
};

var stateSigTermsQuery = {
    "query": {
        "bool": {
            "must": {
                "match_all": {}
            },
            "filter": [
                {
                    "term": {
                        "to_state": "WA"
                    }
                },
                {
                    "term": {
                        "product_group_desc": "Apparel"
                    }
                },
                {
                    "term": {
                        "marketplace_id": 1
                    }
                }
            ]
        }
    },
    "size": 0,
    "aggs": {
        "asins": {
            "significant_terms": {
                "field": "asin",
                "background_filter": {
                    "bool": {
                        "must": {
                            "match_all": {}
                        },
                        "filter": [
                            {
                                "term": {
                                    "product_group_desc": "Apparel"
                                }
                            },
                            {
                                "term": {
                                    "marketplace_id": 1
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
};

var zip3SigTermsQuery = {
    "query": {
        "bool": {
            "must": {
                "match_all": {}
            },
            "filter": [
                {
                    "term": {
                        "to_zip3": "950"
                    }
                },
                {
                    "term": {
                        "product_group_desc": "Apparel"
                    }
                },
                {
                    "term": {
                        "marketplace_id": 1
                    }
                }
            ]
        }
    },
    "size": 0,
    "aggs": {
        "asins": {
            "significant_terms": {
                "field": "asin",
                "background_filter": {
                    "bool": {
                        "must": {
                            "match_all": {}
                        },
                        "filter": [
                            {
                                "term": {
                                    "marketplace_id": 1
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
};

var geoSigTermsQuery = {
    "query": {
        "bool": {
            "must": {
                "match_all": {}
            },
            "filter": [
                {
                    "geo_distance": {
                        "distance": "200km",
                        "destination.coordinates": {
                            "lat": 39.33,
                            "lon": -120.1832
                        }
                    }
                },
                {
                    "term": {
                        "product_group_desc": "Apparel"
                    }
                },
                {
                    "term": {
                        "marketplace_id": 1
                    }
                }
            ]
        }
    },
    "size": 0,
    "aggs": {
        "asins": {
            "significant_terms": {
                "field": "asin",
                "background_filter": {
                    "bool": {
                        "must": {
                            "match_all": {}
                        },
                        "filter": [
                            {
                                "term": {
                                    "product_group_desc": "Apparel"
                                }
                            },
                            {
                                "term": {
                                    "marketplace_id": 1
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
};

// All your GM code must be inside this function
function letsJQuery() {
    const POWER_MESSAGE_HTML = `
    <div class="a-spacing-base">
    <span>See <a id='powerCompare'>local trends</a></span>
    </div>
    `
    // ===============================
    // ===== BEGIN DATA SCRAPING =====
    // ===============================

    // define constants TODO: check if there are other variants
    const TODAY_STRING = "Today";
    const ALL_OPTIONS_DATA_GROUP = "[id='twister']"
    const SIZE_OPTIONS_DATA_GROUP = "[data-a-button-group='{\"name\":\"twister_size_name\"}']"
    const SIMILAR_DATA_GROUP = "[id='HLCXComparisonWidget_feature_div']"

    var isEligibleForDeliveryImprovement; // to be used for determining if delivery improvement message is shown
    var isEligibleForGreenerOption; // to be used for determining if greener product/delivery options are available

    var primaryDelivery;
    var i;

    // $(SIMILAR_DATA_GROUP + " th").each(function() {
    //     var alt = {};
    //     $("a", this).each(function() {
    //         alt.url = this.getAttribute("href");
    //         alt.label = $("span", this).text();
    //     });
    //     if (!alt.url) {
    //         return;
    //     }
    //     // console.log("Similar item", alt.label, alt.url);
    //     fetchPrimaryDelivery(alt, function(res){
    //         alternatives.push(res);
    //         updateModalContent(alternatives);
    //     });
    // });

    //     $(ALL_OPTIONS_DATA_GROUP + " li").each(function() {
    //         // grab information for each option <li>
    //         var alt = {};
    //         alt.id = this.getAttribute("id");
    //         // console.log("alt is ", this);
    //         // Extract what the variant is about
    //         if ((i = alt.id.indexOf("_")) > 0) {
    //             alt.variant = alt.id.substring(0, i);
    //         }
    //         alt.url = this.getAttribute("data-dp-url"); // empty string when the current asin is active
    // //        alt.label = $(this).find("p").text(); // Certain variants have image instead of text.
    //         alt.label = this.getAttribute("title").replace("Click to select ", "");
    //         var isActiveAsin = alt.url == "";
    //         // console.log("Found variant", alt.id, alt.variant, alt.label, alt.url, isActiveAsin);
    //         if (!alt.variant || !alt.label) {
    //             return;
    //         }

    //         if (isActiveAsin) { // get the shipping speed from buyBox
    //             primaryDelivery = parsePrimaryDelivery(document);
    //             // console.log("Found active item promises", primaryDelivery);
    //             //isEligibleForDeliveryImprovement = !(primaryDeliveryText.includes(TODAY_STRING));
    //         } else { // get shipping speed by making a GET request
    //             alt.url = window.location.href.replace(/\/dp\/.*\//, alt.url + '/'); // get new url by replacing asinID between the /dp/../ tags
    //             fetchPrimaryDelivery(alt, function(res){
    //                 alternatives.push(res);
    //                 updateModalContent(alternatives);
    //             });
    //         }
    //     });

    // =============================
    // ===== BEGIN MODAL SETUP =====
    // =============================

    // instantiate new modal
    var modal = new tingle.modal({
        footer: false,
        stickyFooter: false,
        closeMethods: ['overlay', 'button', 'escape'],
        closeLabel: "Close",
        cssClass: ['custom-class-1', 'custom-class-2'],
        onOpen: function () {
            // console.log('modal open');
        },
        onClose: function () {
            // console.log('modal closed');
        },
        beforeClose: function () {
            // here's goes some logic
            // e.g. save content before closing the modal
            return true; // close the modal
            return false; // nothing happens
        }
    });

    function updateModalContent(alternatives) {



        var content = "";
        // // Sort the alternatives by delivery date and crop.
        // alternatives.sort((a, b) => a.delivery > b.delivery ? 1 : -1);
        // alternatives = alternatives.slice(0,5);

        var index = 0;
        // hijack any existing widget
        var widget = $("#sp_detail_thematic-highly_rated");

        if (widget.length == 0) {
            widget = $("#sp_detail_thematic-recent_history");
        }
        if (widget.length == 0) {
            widget = $("#sp_detail");
        }
        if (widget.length == 0) {
            widget = $("#sp_detail2-prime");
        }
        if (widget.length == 0) {
            widget = $("#similarities_feature_div");
        }
        if (widget.length == 0) {
            widget = $("#sp_detail_thematic-top_brands");
        }
        widget.find("h2").text("Trending products in your area");
        widget.find("h2").append(`<div style="font-size:10px;color:black;font-weight:normal">DEX Hackathon 2023</div>`);

        alternatives.some(function (alt) {
            // var dateStr;
            // if (alt.delivery) {
            //     dateStr = alt.delivery.toLocaleString('en-US', {
            //         weekday: 'long', // long, short, narrow
            //         day: 'numeric', // numeric, 2-digit
            //         year: 'numeric', // numeric, 2-digit
            //         month: 'short', // numeric, 2-digit, long, short, narrow
            //         hour: 'numeric', // numeric, 2-digit
            //         minute: 'numeric', // numeric, 2-digit
            //         second: 'numeric', // numeric, 2-digit
            //     });

            //     // Remove date details.
            //     var comma = dateStr.indexOf(",");
            //     comma = dateStr.indexOf(",", comma + 1);
            //     dateStr = dateStr.substring(0, comma);
            // }

            //     var dateStr2 = "";
            //     if (typeof alt.secondaryDelivery == "string") {
            //         dateStr2 = alt.secondaryDelivery;
            //     } else if (alt.secondaryDelivery != null) {
            //         dateStr2 = alt.secondaryDelivery.toLocaleString('en-US', {
            //             weekday: 'long', // long, short, narrow
            //             day: 'numeric', // numeric, 2-digit
            //             year: 'numeric', // numeric, 2-digit
            //             month: 'short', // numeric, 2-digit, long, short, narrow
            //             hour: 'numeric', // numeric, 2-digit
            //             minute: 'numeric', // numeric, 2-digit
            //             second: 'numeric', // numeric, 2-digit
            //         });
            //         // Remove date details.
            //         var comma2 = dateStr2.indexOf(",");
            //         comma2 = dateStr2.indexOf(",", comma2 + 1);
            //         dateStr2 = dateStr2.substring(0, comma2);
            //     }

            //     var variant = "Similar item";
            //     if (alt.variant) {
            //         variant = "Same item, different " + alt.variant;
            //     }

            //            content += "<h3>"+alt.label+"</h3>"+alt.delivery+"<br/>"
            content += `<div class="a-spacing-base" style="min-height: 80px;">
            <a href="${alt.url}" target="_blank"><img src=${alt.imgsrc} style="width: 70px; height: 70px; float: left; margin-right: 8px"></a>
            <div class="a-spacing-base" id="mir-layout-DELIVERY_BLOCK-slot-DELIVERY_MESSAGE">
            <a href="${alt.url}" target="_blank" class="a-popover-trigger a-declarative">
                ${alt.title}
            </a>`;
            // <span>${variant}: </span>
            // content += `<div class="a-popover-preload" id="a-popover-shippingDetailsDisplayContent"></div>
            // <div id="deliverytimes">
            // FREE delivery <b>${dateStr}</b>`;
            content += '<br/>' + alt.delivery;

            // if (dateStr2.length > 2) {
            //     content += ` or fastest delivery <b>${dateStr2}</b>`;
            // }
            content += `</div></div>`;


            widget.find(".a-carousel-viewport").find(".a-carousel-card").eq(index).find(".a-link-normal").find("img").eq(0).attr("src", alt.imgsrc);
            widget.find(".a-carousel-viewport").find(".a-carousel-card").eq(index).find(".a-link-normal").find(".sponsored-products-truncator-truncated").text(alt.title);
            widget.find(".a-carousel-viewport").find(".a-carousel-card").eq(index).find(".a-link-normal").find(".a-color-price").text(alt.price);
            widget.find(".a-carousel-viewport").find(".a-carousel-card").eq(index).find(".a-link-normal").attr("href", alt.url);

            index++;

        })

        // change widget id so it's not affected by the original one
        // widget.attr("id", "trending-products-in-your-area");

        // set content
        modal.setContent(content);


    }

    function osQuery(query) {
        let txtQuery = JSON.stringify(query);
        console.log(`Issuing query for ${txtQuery}`);
        GM_xmlhttpRequest({
            method: 'POST',
            url: osDashURL,
            data: txtQuery,
            headers: {
                "Content-Type": "application/json",
                "Osd-Version": "2.5.0",
                Accept: "*/*",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9",
                "Origin": "https://os-dashboard.prod.bolts-locality-opensearch.dex.amazon.dev",
                "Referer": "https://os-dashboard.prod.bolts-locality-opensearch.dex.amazon.dev/_dashboards/app/dev_tools",

            },
            onload: function (responseDetails) {
                // DO ALL RESPONSE PROCESSING HERE...
                console.log(
                    "GM_xmlhttpRequest() response is:\n",
                    responseDetails.responseText
                );

                let asins = parseAsinList(responseDetails.responseText);
                var alternatives = [];
                if (asins) {
                    asins.forEach(function (asin) {
                        fetchDetails(asin, function (res) {
                            alternatives.push(res);
                            updateModalContent(alternatives);
                        });
                    });
                }
            }
        });
    };

    // Get Glow location.
    let location = $("#glow-ingress-line2").text().trim();
    console.log("Customer location: " + location);
    let postal = location.match(/\d+/g)[0];
    let to_zip3 = postal.substring(0,3);

    // aggQuery.aggs.myagg.terms.size = offers.length;
    // aggQuery.query.bool.filter.terms.offerID = offers;
    zip3SigTermsQuery.query.bool.filter[0].term.to_zip3 = to_zip3;

    // Get the current detail page GL
    var product_group_desc = getDetailPageGL();
    zip3SigTermsQuery.query.bool.filter[1].term.product_group_desc = product_group_desc;

    osQuery(zip3SigTermsQuery);





    // ==================================
    // ===== BEGIN DOM MANIPULATION =====
    // ==================================

    // Add the message after the `deliveryBlockMessage` id
    $("#deliveryBlockMessage").after(POWER_MESSAGE_HTML);
    // open the modal when user clicks on "compare options"
    $("#powerCompare").click(function () {
        // updateModalContent(alternatives);
        modal.open();
    });
}

