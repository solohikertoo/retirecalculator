    var expenseIntervalCount = 1;
    var contribIntervalCount = 1;
    
    var getNumber = function(numberId) {
        var num = document.getElementById(numberId).value;
        if (isNaN(Number(num)) || (num === "")) {
            alert("please enter a valid number for "+numberId);
            return 0;
        } else {
            return Number(num);
        }
    }
    
    var addIntervalChildren = function(intervalName, intervalCount) {
        para = document.createElement("p");
        
        para.appendChild(document.createTextNode(intervalCount+") Age at start: "));
        startInput = document.createElement("input");
        startInput.type="text";
        startInput.id=intervalName+"-start-age"+intervalCount;
        startInput.value="0";
        para.appendChild(startInput);

        para.appendChild(document.createTextNode(" Age at end: "));
        stopInput = document.createElement("input");
        stopInput.type="text";
        stopInput.id=intervalName+"-stop-age"+intervalCount;
        stopInput.value="0";
        para.appendChild(stopInput);
        
        para.appendChild(document.createTextNode(" Yearly amount: $"));
        amountInput = document.createElement("input");
        amountInput.type="text";
        amountInput.id=intervalName+"-amount"+intervalCount;
        amountInput.value="0";
        para.appendChild(amountInput); 
        
        return para;
    }
    
    var addContribInterval = function() {
        contribIntervalCount++;
        para = addIntervalChildren("contrib",contribIntervalCount);      
        
        divelem = document.getElementById("contrib-intervals");
        divelem.appendChild(para);
    }    
    
    var addExpenseInterval = function() {
        expenseIntervalCount++;
        para = addIntervalChildren("expense",expenseIntervalCount);
        
        divelem = document.getElementById("expense-intervals");
        divelem.appendChild(para);
    }
    
    var getIntervalArray = function(intervalName,intervalCount,currentAge,maxAge) {
        var intervalArray = [];
        var ageOffset;
        var maxAgeOffset = maxAge-currentAge;
        var startAgeOffset;
        var stopAgeOffset;
        var amount;
        for (ageOffset=0; ageOffset <= maxAgeOffset; ageOffset++) {
            intervalArray[ageOffset] = 0;
        }
        for (var interval=1; interval <= intervalCount; interval++) {
            startAgeOffset = getNumber(intervalName+"-start-age"+interval) -currentAge;
            stopAgeOffset = getNumber(intervalName+"-stop-age"+interval) -currentAge;
            amount = getNumber(intervalName+"-amount"+interval);
            
            if (startAgeOffset < 0) {
                startAgeOffset =0;
            }
            if (stopAgeOffset > maxAgeOffset) {
                stopAgeOffset = maxAgeOffset;
            }
            for (ageOffset = startAgeOffset; ageOffset <= stopAgeOffset; ageOffset++) {
                intervalArray[ageOffset] = amount;
            }
        }
        return intervalArray;
    }
    
    var calculate = function(data) {
        var expenseArray = getIntervalArray("expense",expenseIntervalCount,data.currentAge,data.maxAge);
        var contribArray = getIntervalArray("contrib",contribIntervalCount,data.currentAge,data.maxAge);
        var ageArray = [];
        var savingArray = [];
        
        var age;
        var savings = data.currentSave;
        var costInflationMult = 1.0;
        var wageInflationMult = 1.0;
        var youngInvestReturnMult = (1.0 + data.youngInvestReturn/100.0);
        var oldInvestReturnMult = (1.0 + data.oldInvestReturn/100.0);
        
        var peakSavings = savings;
        var peakAge =  data.currentAge;
        var prevSavings = savings;
        var runoutSet = false;
        
        for (age = data.currentAge; age<=data.maxAge; age++) {
            ageArray[age-data.currentAge] = age;
            
            savings = savings - expenseArray[age-data.currentAge]*costInflationMult;
            if (age < data.investChangeAge) {
                savings = savings * youngInvestReturnMult;
            } else {
                savings = savings * oldInvestReturnMult;
            }
            savings = savings + contribArray[age-data.currentAge]*wageInflationMult;
            
            costInflationMult = costInflationMult * (1.0 + data.costInflation/100.0);
            wageInflationMult = wageInflationMult * (1.0 + data.wageInflation/100.0);

            if (savings > peakSavings) {
                peakSavings = savings;
                peakAge = age;
            }
            prevSavings = savings;
            if (runoutSet == false) {
                if (savings <= 0) {
                    runoutAge = age;
                    runoutSet = true;
                }
            }
            if (savings > 0) {
                savingArray[age-data.currentAge] = savings;
            } else {
                savingArray[age-data.currentAge] = 0;
            }
        }
        
        var results = {};
        results.peakSavings = peakSavings;
        results.peakAge = peakAge;
        if (runoutSet) {
            results.runoutAge = runoutAge;
        } else {
            results.runoutAge = "\ngreater than maximum age";
        }
        results.ageArray = ageArray;
        results.savingArray = savingArray;
            
        return results;
    }
    
    var setupPlot = function(c,results) {
        var plotSetup ={};
        plotSetup.ctx = c.getContext("2d");
        plotSetup.ctx.clearRect(0, 0, c.width, c.height);
        plotSetup.ctx.font = "14px Arial";

        plotSetup.xOrigin = 80;
        plotSetup.yOrigin = c.height-50;
        plotSetup.horAxisLength = c.width-130;
        plotSetup.vertAxisLength = c.height-110;
        plotSetup.numXticks=9;
        plotSetup.xTickSpace = Math.round(plotSetup.horAxisLength/(plotSetup.numXticks-1));
        plotSetup.numYticks=5;
        plotSetup.yTickSpace = Math.round(plotSetup.vertAxisLength/(plotSetup.numYticks-1));
        plotSetup.tickSize=10;
        plotSetup.ageLabelOff = 5;
        plotSetup.ageSpace = Math.round((results.ageArray[results.ageArray.length-1] -
                                         results.ageArray[0]) / (plotSetup.numXticks-1));
        if (results.peakSavings >= 1e7) {
            plotSetup.scaleFactor = 1e6;
            plotSetup.savingLabel = "Savings (millions $)";
        } else if (results.peakSavings >= 1e4) {
            plotSetup.scaleFactor = 1e3;
            plotSetup.savingLabel = "Savings (thousands $)";
        } else {
            plotSetup.scaleFactor = 1;
            plotSetup.savingLabel = "Savings $";
        }
        plotSetup.savingLabelOff = 50;
        plotSetup.savingSpace = Math.round((results.peakSavings/plotSetup.scaleFactor)/
                                        (plotSetup.numYticks-1));
        
        return plotSetup;
    }
    
    var plotHorizontalAxis = function(plotSetup,results) {
        var ctx = plotSetup.ctx;
        var yPos = plotSetup.yOrigin;
        var xStart = plotSetup.xOrigin;
        var xEnd = plotSetup.xOrigin+plotSetup.horAxisLength;
        var tickTop = yPos-Math.round(plotSetup.tickSize/2);
        var tickBottom = yPos+Math.round(plotSetup.tickSize/2);
        var maxAge = results.ageArray[results.ageArray.length-1];
        var tickX;
        var age;
        
        ctx.moveTo(xStart,yPos);
        ctx.lineTo(xEnd,yPos);
        ctx.stroke();
        
        for (var tick=0; tick<plotSetup.numXticks; tick++) {
            tickX = xStart + Math.min(plotSetup.horAxisLength, tick * plotSetup.xTickSpace);
            ctx.moveTo(tickX,tickTop);
            ctx.lineTo(tickX,tickBottom);
            ctx.stroke();
            age = Math.min(maxAge, results.ageArray[0] + tick * plotSetup.ageSpace);
            ctx.fillText(age,tickX-plotSetup.ageLabelOff,yPos+20);
        }
        ctx.fillText("Age",Math.round((xStart+xEnd)/2), yPos+40);
    }
    
    var plotVerticalAxis = function(plotSetup,results) {
        var ctx = plotSetup.ctx;
        var xPos = plotSetup.xOrigin;
        var yStart = plotSetup.yOrigin;
        var yEnd = plotSetup.yOrigin-plotSetup.vertAxisLength;
        var tickLeft = xPos-Math.round(plotSetup.tickSize/2);
        var tickRight = xPos+Math.round(plotSetup.tickSize/2);
        var tickY;
        var saving;        
        
        ctx.moveTo(xPos,yStart);
        ctx.lineTo(xPos,yEnd);
        ctx.stroke();
        
        for (var tick=0; tick<plotSetup.numYticks; tick++) {
            tickY = yStart - Math.min(plotSetup.vertAxisLength, tick * plotSetup.yTickSpace);
            ctx.moveTo(tickLeft,tickY);
            ctx.lineTo(tickRight,tickY);
            ctx.stroke();
            saving = tick * plotSetup.savingSpace;
            ctx.fillText(saving,xPos-plotSetup.savingLabelOff,tickY+5);
        }
        ctx.fillText(plotSetup.savingLabel,10,20);
    }
    
    var plotGraph = function(plotSetup,results) {
        var ctx = plotSetup.ctx;
        ctx.lineWidth=3;
        ctx.strokeStyle = "#40B0A8";
        var numpts = results.savingArray.length;
        var age0 = results.ageArray[0];
        var xScale = plotSetup.xTickSpace / plotSetup.ageSpace;
        var yScale = plotSetup.yTickSpace / plotSetup.savingSpace;
        var x0 = plotSetup.xOrigin;
        var y0 = plotSetup.yOrigin - 
                 Math.round((results.savingArray[0]/plotSetup.scaleFactor) * yScale);
        var x1;
        var y1;
        
        plotSetup.ctx.beginPath()
        for (var pnt=1; pnt<numpts; pnt++) {
            x1 = plotSetup.xOrigin + Math.round((results.ageArray[pnt]-age0)*xScale);
            y1 = plotSetup.yOrigin - 
                 Math.floor((results.savingArray[pnt]/plotSetup.scaleFactor) *yScale);
            ctx.moveTo(x0,y0);
            ctx.lineTo(x1,y1);
            ctx.stroke();
            x0 = x1;
            y0 = y1;
        }
        plotSetup.ctx.closePath();
    }
    
    var plotData = function (results) {
        var c = document.getElementById("myCanvas");
        ctx = c.getContext("2d");
        ctx.beginPath();
        ctx.lineWidth=1;
        ctx.strokeStyle = "#000000";
        plotSetup = setupPlot(c,results);
        plotHorizontalAxis(plotSetup,results);
        plotVerticalAxis(plotSetup,results);
        plotGraph(plotSetup,results);
        ctx.closePath();
    }
    
    var getResult = function() {
        var data = {};
        data.currentSave = getNumber("current-save");
        data.currentAge = getNumber("current-age");
        data.costInflation = getNumber("cost-inflation");
        data.wageInflation = getNumber("wage-inflation");
        data.youngInvestReturn = getNumber("young-invest-return");
        data.oldInvestReturn = getNumber("old-invest-return");
        data.investChangeAge = getNumber("invest-change-age");
        data.maxAge = getNumber("max-age");
        
        results = calculate(data);
        plotData(results);
        
        document.getElementById("peak-saving").innerHTML = results.peakSavings.toFixed(0);
        document.getElementById("peak-age").innerHTML = results.peakAge;
        document.getElementById("runout-age").innerHTML = results.runoutAge;
        
    }