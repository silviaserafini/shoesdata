//price-range-slider
$(function () {
    $("#slider-range").slider({
        range: true,
        min: 0,
        max: 500,
        values: [0, 500],
        slide: function (event, ui) {
            $("#amount").val("$" + ui.values[0] + " - $" + ui.values[1]);
            brandFilter();
        }
    });
    $("#amount").val("$" + $("#slider-range").slider("values", 0) +
        " - $" + $("#slider-range").slider("values", 1));
});

//heel-to-toe-drop-slider
$(function () {
    $("#slider-range-drop").slider({
        range: true,
        min: -1,
        max: 14,
        values: [-1, 14],
        slide: function (event, ui) {
            $("#drop-amount").val(ui.values[0] + " mm - " + ui.values[1] + " mm");
            brandFilter();
        }
    });
    $("#drop-amount").val($("#slider-range-drop").slider("values", 0) +
        " mm - " + $("#slider-range-drop").slider("values", 1) + " mm");
});

function getSliderValues() {
    return {
        minDrop: $("#slider-range-drop").slider("values", 0),
        maxDrop: $("#slider-range-drop").slider("values", 1),
        minPrice: $("#slider-range").slider("values", 0),
        maxPrice: $("#slider-range").slider("values", 1)
    };
}

function filterSliderValues(shoes_data) {
    const sliderValues = getSliderValues();
    let included_shoes = JSON.parse(JSON.stringify(shoes_data));
    included_shoes = included_shoes.filter(shoe => (shoe["heel-to-toe-drop"] >= sliderValues.minDrop) && (shoe["heel-to-toe-drop"] <= sliderValues.maxDrop));
    included_shoes = included_shoes.filter(shoe => (shoe.price >= sliderValues.minPrice) && (shoe.price <= sliderValues.maxPrice));
    return included_shoes;
}

//appending category options 
function load_options(elementId, feature) {
    const categories = shoes_data.map(shoe => shoe[feature]);
    const categorySet = new Set(categories);
    const categoryList = Array.from(categorySet).sort();
    appendOptions(categoryList, elementId);
}

function getSelectedOptions(selectId) {
    const options_list = document.getElementById(selectId);
    return [...options_list.options].filter(option => option.selected)
        .map(option => option.value);
}

function appendOptions(list, elementId) {
    const domElement = document.getElementById(elementId);
    list.forEach(listElement => {
        const opt = document.createElement("option");
        opt.value = listElement;
        opt.innerHTML = listElement;
        domElement.appendChild(opt);
    });
}

//appending brands options
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function addBrands() {
    const categories = getSelectedOptions("category_list");
    const brands = shoes_data.filter(shoe => categories.includes(shoe.category)).map(shoe => shoe.brand);
    const brandSet = new Set(brands);
    const brandList = Array.from(brandSet).sort();
    const select = document.getElementById("brand_list");
    removeAllChildNodes(select);
    appendOptions(brandList, "brand_list");
}

//getting chackbox values
function filterBoxValue(checkboxIds, shoes_data) {
    let included_shoes = JSON.parse(JSON.stringify(shoes_data));

    checkboxIds.forEach(checkboxId => {
        const checked = document.getElementById(checkboxId).checked;
        if (checked) {
            included_shoes = included_shoes.filter(shoe => shoe[checkboxId]);
        }
    });
    return included_shoes;
}

function resetForm() {
    document.getElementById("myForm").reset();
}

//filtering and plotting
let shoe_instances = [];

function brandFilter() {
    const categories = getSelectedOptions("category_list");
    const brands = getSelectedOptions("brand_list");
    shoe_instances = shoes_data.filter(shoe => brands.includes(shoe.brand)).filter(shoe => categories.includes(shoe.category));
    shoe_instances = filterSliderValues(shoe_instances);
    const boxIds = ["breathable", "cushioned", "waterproof"];
    shoe_instances = filterBoxValue(boxIds, shoe_instances);

    //scatterplot Price-Score
    const x = shoe_instances.map(shoe => shoe.price);
    const y = shoe_instances.map(shoe => shoe["expert-score"]);
    const labels = shoe_instances.map(shoe => shoe.name);
    const plotConfig = {
        "x": x,
        "y": y,
        "labels": labels,
        "xAxisName": "price [$]",
        "yAxisName": "score",
        "title": "Score vs Price",
        "graphId": "myChart"
    };

    plot(plotConfig);

    const xFit = shoe_instances.map(shoe => shoe.width);
    console.log(xFit)
    const plotConfigFitScore = {
        "x": xFit,
        "y": y,
        "labels": labels,
        "xAxisName": "fit",
        "yAxisName": "score",
        "title": "Score vs Fit",
        "graphId": "fitScore"
    }
    plot(plotConfigFitScore);
    //boxplots

    //score
    const boxPlotScoreConfig = getBoxplotConfig(brands, shoe_instances, "expert-score", "expert-score", "Expert Score Comparison", "boxPlotScore");
    boxPlot(boxPlotScoreConfig);

    //price
    const boxPlotPriceConfig = getBoxplotConfig(brands, shoe_instances, "price", "price [$]", "Price Comparison", "boxPlotPrice");
    boxPlot(boxPlotPriceConfig);

    //weight
    const boxPlotWeightConfig = getBoxplotConfig(brands, shoe_instances, "weight", "weight [g]", "Weight Comparison", "boxPlotWeight");
    boxPlot(boxPlotWeightConfig);
}

function plot_matrix() {
    const brand = getSelectedOptions("brand_list");
    shoe_instances = shoes_data.filter(shoe => brand.includes(shoe.brand));
    const x = shoe_instances.map(shoe => shoe.category);
    const y = shoe_instances.map(shoe => shoe.price);
    const labels = shoe_instances.map(shoe => shoe.name);
    const plotConfig = {
        "x": x,
        "y": y,
        "labels": labels,
        "xAxisName": "category",
        "yAxisName": "price [$]",
        "title": "Comparison",
        "graphId": "myChart"
    }
    plot(plotConfig);
}


function getFeaturesPerBrand(brands, shoe_instances, feature) {
    return brands.map((brand) => {
        return shoe_instances.filter(shoe => shoe.brand === brand).map(shoe => shoe[feature])
    });
}

function getBoxplotConfig(brands, shoe_instances, feature, yAxisName, title, graphId) {
    const yFeature = getFeaturesPerBrand(brands, shoe_instances, feature);
    return {
        "yTraces": yFeature,
        "labels": brands,
        "yAxisName": yAxisName,
        "title": title,
        "graphId": graphId
    };
}

$("#myChart").on("plotly_click", function (event, data) {
    const index = parseInt(data.points[0].pointNumber, 10);
    const clickedShoe = shoe_instances[index];
    const link = clickedShoe.img_url_sm;
    document.getElementById("shoeImg").src = link;
    document.getElementById("shoeImg").style.visibility = "visible";
    document.getElementById("listOfFeatures").style.visibility = "visible";
    //empty the featuresTable
    const featuresTable = document.getElementById("listOfFeatures").getElementsByTagName("tbody")[0];
    removeAllChildNodes(featuresTable);
    //add new options
    for (let [featureKey, shoeFeature] of Object.entries(clickedShoe)) {
        if (shoeFeature != null && featureKey != "img_url_sm") {
            const newrow = featuresTable.insertRow();
            let newcell = newrow.insertCell(0);
            let nextText = document.createTextNode(featureKey);
            newcell.appendChild(nextText);
            newcell = newrow.insertCell(1);
            nextText = document.createTextNode(shoeFeature);
            newcell.appendChild(nextText);
        }
    }
});

//plots
function plot(config) {
    const ctx = document.getElementById(config.graphId);
    const trace1 = {
        x: config.x,
        y: config.y,
        mode: "markers+text",
        type: "scatter",
        name: "Team A",
        text: config.labels,
        textposition: "top center",
        textfont: {
            family: "Raleway, sans-serif"
        },
        marker: {
            size: 12
        }
    };
    const layout = {
        xaxis: {
            autorange: true,
            range: [0, 1000],
            title: {
                text: config.xAxisName
            }
        },
        yaxis: {
            autorange: true,
            range: [0, 1000],
            title: {
                text: config.yAxisName
            }
        },
        legend: {
            y: 0.5,
            yref: "paper",
            font: {
                family: "Arial, sans-serif",
                size: 20,
                color: "grey",
            }
        },
        title: config.title,
        paper_bgcolor: 'rgb(243, 243, 243)',
        plot_bgcolor: 'rgb(243, 243, 243)',
    };
    const data = [trace1];
    Plotly.newPlot(ctx, data, layout);
}

function boxPlot(config) {
    const ctx = document.getElementById(config.graphId);
    const data = config.labels.map((label, index) => {
        let yTrace = config.yTraces[index]
        yTrace = yTrace.filter(el => el > 0);

        const trace = {
            y: yTrace,
            name: label,
            boxpoints: 'all',
            mode: "markers+text",
            type: "box",
            jitter: 0.5,
            whiskerwidth: 0.2,
            fillcolor: 'cls',
            marker: {
                size: 2
            },
            line: {
                width: 1
            }
        };
        return trace;
    });
    const layout = {
        yaxis: {
            autorange: true,

            title: {
                text: config.yAxisName
            },
            zeroline: true,
            gridcolor: 'rgb(255, 255, 255)',
            gridwidth: 1,
            zerolinecolor: 'rgb(255, 255, 255)',
            zerolinewidth: 2
        },
        legend: {
            y: 0.5,
            yref: "paper",
            font: {
                family: "Arial, sans-serif",
                size: 15,
                color: "grey",
            }
        },
        title: config.title,
        paper_bgcolor: 'rgb(243, 243, 243)',
        plot_bgcolor: 'rgb(243, 243, 243)',
    };

    Plotly.newPlot(ctx, data, layout);
}