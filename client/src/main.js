"use strict";

/*
Checklist:

Coding *looks* super fast
Test & debug cycle looks awesome
Javascript interpreter complete

Possible to write new modules, create and implement interfaces.

Conditionals and lambdas start cursor inside
Cannot delete lambda or cond
Cannot extend cond

 --- done ---

Ternary boolean operator

*/

var wf = require('wf-jsinterp');
var d3 = require('d3-browserify');
var sha256 = require('fast-sha256');

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
    return {
	x: centerX + (radius * Math.cos(angleInRadians)),
	y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x, y, radius, startAngle, endAngle){
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
    var d = [
	"M", start.x, start.y, 
	"A", radius, radius, 0, arcSweep, 0, end.x, end.y
    ].join(" ");
    return d;       
}

function uuid() {
    function s4() {
	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
}

function http(method, url, data, onOk, onError) {
    var request = new XMLHttpRequest();
    request.open(method, url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onload = function() {
	if (request.status >= 200 && request.status < 400) {
	    onOk(request.responseText);
	} else {
	    onError(request);
	}
    };
    request.onerror = function(){return onError(request);};
    if (data) {
	request.send(data);
    } else {
	request.send();
    }
    return request;
}

var container = document.getElementById('svgcontainer');

function genSvg(width, height) {
    var svgState = {
	'width': width,
	'height': height,
	'r': function(x) { return width - x; },
	'l': function(x) { return x; },
	'b': function(y) { return height - y; },
	'elem': d3.select('#svgcontainer')
	    .append('svg:svg')
	    .attr('viewBox', '0 0 '+width+' '+height)
    };
    svgState.topSplit = height / 2 - 40;
    svgState.bottomSplit = svgState.topSplit + 140;
    return svgState;
}

function genEditorState() {
}


var s = genSvg(window.innerWidth, window.innerHeight);
var codeRoot = s.elem.append('svg:g').attr('id','root');
var line = d3.svg.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; })
    .interpolate('basis');
var shapeCoords = [
    [10, 10], [100, 10], [100, 100], [10, 100]                  
];


function newGrid() {
    var grid = {}; // "x,y" strings to truth value
    function occupied(x,y) { return grid[x+","+y]; }
    function fill(x,y) { grid[x+","+y] = true; }
    function boxClear(x,y,w,h) {
    }
}

function svgText(group, x, y, text, ptSize, rot) {
    var textElem = group.append('svg:text').attr('x', x).attr('y', y).attr('font-family','Verdana').attr('font-size',ptSize);
    if (rot) {
	textElem = textElem.attr('transform', 'rotate('+rot+')');
    }
    textElem.text(text);
    return textElem;
}

function linkableFittedText(group, data, bbox, cb) {
    var group = fittedText(group, ""+data, bbox, cb);
    group.node().addEventListener('click', function() { return cb.origin(data); });
    return group;
}

function fittedText(group, text, bbox, cb) {
    var elem = group.append('svg:text').attr('x',0).attr('y',0).attr('font-family','Verdana').attr('font-size',10);
    elem.attr('alignment-baseline', 'text-before-edge').text(text);
    var startBox = elem.node().getBBox();
    var scaleWidth = bbox.width / startBox.width;
    var scaleHeight = bbox.height / startBox.height;
    elem.attr('transform', 'translate('+bbox.x+','+bbox.y+') scale('+Math.min(scaleWidth, scaleHeight)+')');
    return elem;
}

function bbox(d3elem) {
    return d3elem.node().getBBox();
}

function TraceableData(data, savedExecution) {
    this.data = data;
    this.saved = savedExecution;
}

var _ELLIPSIS = new Object();
function layoutMapData(container, data, bbox, cb) {
    var group = container.append('svg:g');
    // TODO
    return group;
}
function layoutListData(container, wfData, bbox, cb) {
    var data = wfData.toArray();
    var count = data.length;
    var isWide = (bbox.width > bbox.height);
    var longSide = (isWide) ? bbox.width : bbox.height;
    var group = container.append('svg:g');

    function iterate(items) {
	var ct = items.length;
	var run = longSide / ct;
	var n = 2;
	items.forEach(function(item, idx) {
	    var start = longSide * idx / ct;
	    var newBox, divider;
	    if (isWide) {
		newBox = {x:bbox.x+n+start, y:bbox.y+n, width:run-2*n, height:bbox.height-2*n};
		if (idx > 0) {
		    divider = group.append('svg:line').attr('x1',newBox.x).attr('y1',newBox.y).attr('x2',newBox.x).attr('y2',newBox.y+newBox.height);
		}
	    } else {
		newBox = {x:bbox.x+n, y:bbox.y+n+start, width:bbox.width-2*n, height:run-2*n};
		if (idx > 0) {
		    divider = group.append('svg:line').attr('x1',newBox.x).attr('y1',newBox.y).attr('x2',newBox.x+newBox.width).attr('y2',newBox.y);
		}
	    }
	    layoutData(group, item, newBox, cb);
	    if (divider) {
		divider.attr('stroke','#600');
		divider.node().addEventListener('click', function() { return cb.origin(wfData); });
	    }
	});
    }

    var doCompress = (longSide / count) < 12;
    if (doCompress) {
	var numItems = Math.floor((longSide - 5) / 12) + 1;
	if (numItems <= 0) {
	    layoutData(group, _ELLIPSIS, bbox, cb);
	    return group;
	} else if (numItems == 1) {
	    data = data[0].concat([_ELLIPSIS]);
	} else {
	    data = data.slice(0, numItems - 1).concat([ellipsis]).concat(data[data.length - 1]);
	}
    }
    iterate(data);
    return group;
}
function layoutFunctionData(container, data, bbox, cb) {
    var group = fittedText(container, '<func>', bbox);
    group.node().addEventListener('click', function() { return cb.origin(data); });
    return group;
}
function layoutError(container, data, bbox, cb) {
    var group = fittedText(container, '<err>', bbox);
    group.node().addEventListener('click', function() { return cb.origin(data); });
    return group;
}
var _DATA_LAYOUTS = {
    'number': linkableFittedText,
    'string': linkableFittedText,
    'null': linkableFittedText,
    'error': layoutError,
    'map': layoutMapData,
    'list': layoutListData,
    'function': layoutFunctionData,
};
function layoutData(container, data, bbox, cb) {
    if (data === _ELLIPSIS) {
	var group = fittedText(container, '...', bbox);
	group.node().addEventListener('click', function() { return cb.origin(data); });
	return group;
    } else {
	var typ = wf.typeOf(data);
	return _DATA_LAYOUTS[typ](container, data, bbox, cb);
    }
}

function updateInputsAndOutputs(module) {
    var callstack = [];
    // TODO this whole thing needs to be inverted ... shouldn't call strand stuff here
    // instead should do the calculation here and have the strand stuff use that.
    wf.visitModule(module, {
	bottomUpFn: function(fn, path, module) {
	    var strand = codeToStrand(fn.code, null);
	    fn._wft_numConsumed = fn.numConsumed = strand.numConsumed;
	    fn._wft_numProduced = fn.numProduced = strand.numProduced;
	},
	op: function(codeOp, path, fn) {
	    var basic = baseVisuals[codeOp.op];
	    if (basic !== undefined) {
		codeOp._wft_numConsumed = basic.numConsumed;
		codeOp._wft_numProduced = basic.numProduced;
	    } else {
		var target = resolveFn(codeOp.op, module);
		// TODO handle mutual recursion somehow!
		codeOp._wft_numConsumed = target.fn.numConsumed;
		codeOp._wft_numProduced = target.fn.numProduced;
	    }
	}
    });
}

function layoutModule() {
    var container = codeRoot;
    var group = container.append('svg:g');
    var cursors = [];
    if (runState.ideState.moduleUrls.length === 0) {
	return {group:group, cursors:cursors};
    }
    var env = runState.codeEnv;
    var module = env.modules[runState.ideState.moduleUrls[0]];

    updateInputsAndOutputs(module);

    var y = 0;
    var box = bbox(svgText(group, 0, 0, module.name, 28));
    y += box.height;
    //box = bbox(svgText(group, 0, y*0.5, runState.ideState.moduleUrls[0], 10));
    //y += box.height;
    for(var fnId in module.functions) {
	var fn = module.functions[fnId];
	var name = fn.comment;

	var strand = blockToStrand(fn, env);
	var codeLayout = layoutStrand(group, strand, 0);
	cursors = cursors.concat(codeLayout.cursors);
	var codeBBox = codeLayout.bbox;
	var sectionHeight = Math.log(codeBBox.width) * 10;
	var codeScale = sectionHeight / codeBBox.width;
	codeLayout.group.attr('transform', 'translate(0,'+(y+sectionHeight)+') scale('+codeScale+') rotate(-90)');

	var txt = svgText(group, 0, 0, fn.name, 17);
	var textBBox = bbox(txt);
	if (textBBox.width < sectionHeight) { // vertical text
	    txt.attr('transform', 'translate(0,'+(y + textBBox.width)+') rotate(-90)');
	} else {
	    txt.attr('transform', 'translate(-'+textBBox.width+','+(y+textBBox.height)+')');
	}
	cursors.push({node:txt.node(), opident:fn, opcontainer:module.functions, optype:'function'});
	y += sectionHeight;
    }
    return {group:group, cursors:cursors};
}

function collapseStrand(strand) {
    var numProduced = 0;
    var numConsumed = 0;
    strand.forEach(function(item) {
	var curConsumed = item.numConsumed;
	if (numProduced > 0) {
	    var delta = Math.min(curConsumed, numProduced);
	    numProduced -= delta;
	    curConsumed -= delta;
	}
	numConsumed += curConsumed;
	numProduced += item.numProduced;
	if (item.depth != 0) throw new Error('depths not supported yet');
    });
    var mergedText = [].concat.apply([], strand.map(function(i){return i.lineText;}));
    return {
	lineText: mergedText,
	numConsumed: numConsumed,
	numProduced: numProduced,
	depth: 0,
    };
}

function strandItemWidth(strandItem) {
    return strandItem.lineText.map(function(txt){return txt.label.length + 1;}).reduce(function(a,b){return a+b;});
}

function optimizeStrandItems(strand) {
    while(true) {
	var result = optimizeStrandItemsPass(strand);
	if (result.length == strand.length) {
	    return result;
	}
	strand = result;
    }
}
function optimizeStrandItemsPass(strand) {
    if (strand.length == 0) return [];
    var newStrand = [strand[0]];
    for(var idx=1; idx < strand.length; idx++) {
	var item1 = newStrand[newStrand.length - 1];
	var item2 = strand[idx];
	var canCombine = true;
	var internalComplexity = Math.min(item1.numProduced, item2.numConsumed);
	internalComplexity = (internalComplexity * 2) / (item1.numConsumed + item1.numProduced + item2.numConsumed + item2.numProduced);
	if (internalComplexity < 0.5) canCombine = false;
	if (canCombine) {
	    if (item1.subStrands || item2.subStrands) canCombine = false;
	}
	if (canCombine) {
	    var txtLen = strandItemWidth(item1) + strandItemWidth(item2);
	    if (txtLen > 20) canCombine = false;
	}
	if (canCombine) {
	    newStrand.push(collapseStrand([newStrand.pop(), item2]));
	} else {
	    newStrand.push(item2);
	}
    }
    return newStrand;
}

function blockToStrand(block, env) {
    var codeStrand = codeToStrand(block.code, env);
    if (block.condition === undefined) {
	return codeStrand;
    }
    var condStrand = codeToStrand(block.condition, env);
    var numConsumed = Math.max(condStrand.numConsumed, codeStrand.numConsumed);
    var numProduced = codeStrand.numProduced + (numConsumed - codeStrand.numConsumed);
    condStrand.numConsumed = numConsumed;
    codeStrand.numConsumed = numConsumed;
    return {
	cond:condStrand, 
	code:codeStrand,
	numConsumed: numConsumed,
	numProduced: numProduced,
    }
}

var baseVisuals = {
    'literal': function(op, env) {
	return {lineText:[JSON.stringify(op.val)], numConsumed:0, numProduced:1, depth:0}; 
    },
    'lambda': function(op, env) {
	return {lineText:[''], syncArgs:false, numConsumed:0, numProduced:1, depth:0, subStrands:[codeToStrand(op.code, env)]}
    },
    'callLambda': function(op, env) {
	return {lineText:['call'], numConsumed:op.numConsumed + 1, numProduced:op.numProduced, depth:0}
    },
    'save': function(op, env) {
	return {lineText:['>'+op.name], numConsumed:1, numProduced:0, depth:0};
    },
    'load': function(op, env) {
	return {lineText:[op.name+'>'], numConsumed:0, numProduced:1, depth:0};
    },
    'cond': function(op, env) {
	var maxConsumed = 0;
	var maxProduced = 0;
	var branches = op.branches.map(function(branch){
	    var strand = blockToStrand(branch); 
	    maxConsumed = Math.max(maxConsumed, strand.numConsumed);
	    maxProduced = Math.max(maxProduced, strand.numProduced);
	    return strand;
	});
	if (branches.length > 0) {
	    branches[branches.length - 1].tailOfConditional = op;
	}
	return {lineText:[''], syncArgs:true, numConsumed:maxConsumed, numProduced:maxProduced, depth:0, subStrands:branches};
    },
    'dynamicScope': function(op, env) {
	var strand = codeToStrand(op.code, env);
	var item = collapseStrand(strand);
	item.lineText = ['['+op.name+']'];
	item.depth = 0;
	item.items = strand;
    }
}
function codeToStrand(code, env) {
    var items = code.map(function(op){return opToStrandItem(op, env, code);});
    items = optimizeStrandItems(items);
    var collapsed = collapseStrand(items);
    return {
	items: items,
	numConsumed: collapsed.numConsumed,
	numProduced: collapsed.numProduced,
	codearray: code,
    };
}

function opToStrandItem(op, env, containingOpList) {
    var result;
    var visualization = baseVisuals[op.op];
    if (visualization === undefined) {
	var fn = resolveFn(op.op, runState.curModule()).fn;
	result = {lineText:[fn.name], numConsumed:fn.numConsumed, numProduced:fn.numProduced, depth:0};
    } else {
	result = visualization(op, env);
    }
    result.lineText[0] = {
	label:result.lineText[0],
	op:op,
	container: containingOpList};
    return result;
}

function transform(elem, transformName, args) {
    var cur = elem.attr('transform');
    return elem.attr('transform', transformName+'('+args.join(',')+') ' + (cur ? cur : ''));
}

function makesha(str) {
    var hsh = sha256(str);
    return Array.prototype.map.call(hsh, function(n) {
	return n.toString(16);
    }).join('');
}

function nextVersionUrl(curUrl) {
    var parts = curUrl.split('/');
    parts[parts.length - 1] = uuid();
    return parts.join('/');
}

function cleanModule(module) {
    function strip(node, path) {
	Object.keys(node).forEach(function(key) {
	    if (key.length > 0 && key[0] === '_') {
		delete node[key];
	    }
	});
    }
    wf.visitModule(module, {fn:strip, block:strip, op:strip});
}

function saveModule(url, module, okCb, errCb) {
    console.log('saving module ', url);
    cleanModule(module);
    var body = JSON.stringify(module);
    http('PUT', url, body, okCb, errCb);
    return makesha(body);
}

function deleteModule(url, okCb, errCb) {
    console.log('deleting module ', url);
    http('DELETE', url, null, okCb, errCb);
}

function searchModules(searchUrl, searchString, cb) {
    var url = searchUrl + '?q=' +encodeURIComponent(searchString);
    http('GET', url, null, function (body) {
	var hits = JSON.parse(body);
	cb(hits);
    });
}

function loadModules(urls, env, loadedCb, idx) {
    if (idx === undefined) idx = urls.length - 1;
    if (idx < 0) {
	loadedCb();
    } else {
	var loadNext = function(){ loadModules(urls, env, loadedCb, idx - 1); };
	loadModule(urls[idx], env, loadNext,
		   function() { console.log('load failed on '+urls[idx]); return loadNext();});
    }
}

function loadModule(url, env, loadedCb, errCb) {
    console.log('loading module ', url);
    env.loading[url] = 1;
    http('GET', url, null, function(body) {
	var hsh = makesha(body);
	var module = JSON.parse(body);
	delete env.loading[url];
	env.modules[url] = module;
	module.refs.forEach(function(ref) {
	    if (env.modules[ref.url] === undefined && env.loading[ref.url] === undefined) {
		loadModule(ref.url, env, loadedCb, errCb);
	    }
	});
	// check to see if I am the last module loaded
	if (Object.keys(env.loading).length === 0) {
	    loadedCb();
	}
    }, function(err) {
	console.log('unable to load module ', err, url);
	delete env.loading[url];
	errCb(err);
    });
}

function layoutStrand(container, strand, recurDepth) {
    // returns svg rooted at 0,0 going down and to the right or left, along with a bounding geometry
    var group = container.append('svg:g');
    if (strand.code !== undefined) {
	var condLayout = layoutStrand(group, strand.cond, recurDepth);
	var codeLayout = layoutStrand(group, strand.code, recurDepth);
	var cursors = condLayout.cursors.concat(codeLayout.cursors);

	// attach conditional extending handler
	var containingConditional = strand.tailOfConditional;
	if (containingConditional) {
	    var lastCursor = cursors[cursors.length - 1];
	    lastCursor.onNext = function() {
		var branches = containingConditional.branches;
		var lastBranch = branches[branches.length - 1];
		if (lastBranch.code.length + lastBranch.condition.length === 0) {
		    branches.pop();
		    if (branches.length === 0) {
			// removeFromArray(containingConditional, ???);
			console.log('NOT IMPLEMENTED - delete conditional');
		    } else {
			console.log('NOT IMPLEMENTED - move to cursor after conditional');
		    }
		} else {
		    containingConditional.branches.push({condition:[], code:[]});
		}
		layoutCode();
	    };
	}

	var codeY = condLayout.bbox.height + 10;
	transform(codeLayout.group, 'translate', [0, codeY]);
	return {
	    'group':group, 
	    'bbox':{
		width: Math.max(condLayout.bbox.width, codeLayout.bbox.width),
		height: codeY + codeLayout.bbox.height
	    },
	    'cursors': cursors
	};
    }
    var lineGroup = group.append('svg:g');
    var textGroup = group.append('svg:g'); // to force text to appear on top of lines
    var lineHeight = 22;
    var lineHeightMargin = 6;
    var stackSpacing = 10;
    var stackLines = [];
    var y = 0;
    var stackColors = ['#bbb','#ddd','#bbb','#999'];
    var cursors = [];
    function plotStackLine() {
	if (stackLines.length === 0) {
	    console.log('consumed/produced inconsistency detected');
	    return;
	}
	var x = stackLines.length * stackSpacing;
	var width = stackSpacing;
	var y1 = stackLines.pop();
	var height = y - y1;
	var fill = stackColors[stackLines.length % stackColors.length];
	lineGroup.append('svg:rect').attr('x',x).attr('width',width).attr('y',y1).attr('height',height).attr('fill',fill).attr('stroke','none');
    }
    function curIndent(outdent) { return (stackLines.length - outdent + 1.3) * stackSpacing; }
    for(var i=strand.numConsumed - 1; i>=0; i--) {
	stackLines.push(0);
    }
    y += lineHeightMargin;
    var maxX = 0;
    strand.items.forEach(function(item, index) {
	for(var i=item.numConsumed - 1; i>=0; i--) {
	    plotStackLine();
	}
	var startX = curIndent(item.depth);
	if (item.subStrands && item.subStrands.length > 0) {
	    item.subStrands.forEach(function(subStrand, idx) {
		// TODO if these substrands are conditionals, we need to reconcile the inputs and outputs 
		// together with the external code.  if it's a lambda, it doesn't matter
		var subContainer = textGroup.append('svg:g');
		var rec = layoutStrand(subContainer, subStrand, recurDepth + 1);
		cursors = cursors.concat(rec.cursors);
		var subWidth = rec.bbox.width;
		var subHeight = rec.bbox.height;
		if (item.syncArgs) {
		    if (subStrand.numConsumed !== item.numConsumed) {
			console.log('branch does not consume as many values as others');
			subContainer.append('svg:circle').attr('cx',subWidth/2).attr('cy', 0).attr('r', 6).attr('fill','#a22');
		    }
		    if (subStrand.numProduced !== item.numProduced) {
			console.log('branch does not produce as many values as others');
			subContainer.append('svg:circle').attr('cx',subWidth/2).attr('cy', subHeight).attr('r', 6).attr('fill','#a22');
		    }
		}
		if (idx !== 0) {
		    textGroup.append('svg:line').attr('x1',startX).attr('y1',y).attr('x2',startX+subHeight).attr('y2',y).attr('stroke','#600');
		}
		if (recurDepth % 2 === 0) {
		    y += subWidth;
		    subContainer.attr('transform', 'translate('+(startX+subHeight)+','+(y-subWidth)+') rotate(90)');
		} else {
		    subContainer.attr('transform', 'translate('+(startX)+','+(y+subWidth)+') rotate(-90)');
		    y += subWidth;
		}
		maxX = Math.max(maxX, startX + subHeight);
	    });
	} else {
	    y += lineHeight;
	    var wordX = startX;
	    item.lineText.forEach(function(op) {
		var word = op.label;
		var textBump = 4;
		var text = textGroup.append('svg:text').attr('x',wordX).attr('y',y-textBump).attr('font-family','Verdana').attr('font-size',17);
		text.text(word + ' ');
		var wordLength = text.node().getComputedTextLength();
		cursors.push({node:text.node(), opcontainer:op.container, opident:op.op, optype:'op'});
		wordX += wordLength + (wordLength / (word.length * 2) );
	    });
	    maxX = Math.max(maxX, wordX);
	}
	for(var i=item.numProduced - 1; i>=0; i--) {
	    stackLines.push(y);
	}
	y += lineHeightMargin;
    });
    var cursorWidth = 10;
    var tailCursorLine = lineGroup.append('svg:rect').attr('x', curIndent(0)).attr('width',cursorWidth).attr('y',y).attr('height',1).attr('fill','#ddd').attr('stroke','none');
    maxX = Math.max(maxX, curIndent(0) + cursorWidth);
    cursors.push({node:tailCursorLine.node(), opcontainer:strand.codearray, opident:strand.codearray, optype:'op'});
    while (stackLines.length > 0) {
	plotStackLine();
    }
    return {'group':group, 'bbox':{width:maxX, height:y}, 'cursors':cursors};
}

function makeDragHandle(group, x, y, handleRadius, dragCb, tapCb, userSuppliedHandle) {
    var handle;
    if (userSuppliedHandle !== undefined) {
	handle = userSuppliedHandle;
    } else {
	handle = group.append('svg:circle').attr('cx',x).attr('cy',y).attr('r',handleRadius).attr('stroke-width',3).attr('stroke','#666').attr('fill','#777');
    }
    var sx=null;
    var sy=null;
    var cx=null;
    var cy=null;
    var touchable = handle[0][0];
    var touchId=null;
    function scroll() {
	if (sx === null) {
	    dragCb(0, 0, handle);
	} else {
	    dragCb(cx - sx, cy - sy, handle, cx, cy);
	    setTimeout(scroll, 20);
	}
    }
    var longTouchTimer=null;
    function clearLongTouchTimer() {
	if (longTouchTimer !== null) {
	    clearTimeout(longTouchTimer);
	    longTouchTimer = null;
	}
    }
    touchable.addEventListener('touchstart', function(evt){
	if (tapCb && tapCb.longexec) {
	    clearLongTouchTimer();
	    longTouchTimer = setTimeout(function() {
		tapCb.longexec();
		touchId=sx=sy=cx=cy=null;
	    }, 1000);
	}
	touchId = evt.changedTouches[0].identifier;
	cx=sx=evt.changedTouches[0].pageX;
	cy=sy=evt.changedTouches[0].pageY;
	scroll();
    });
    touchable.addEventListener('touchend', function(evt){
	clearLongTouchTimer();
	touchId=sx=sy=cx=cy=null;
    });
    touchable.addEventListener('click', function(evt){
	clearLongTouchTimer();
	if (tapCb) {
	    tapCb();
	}
    });
    touchable.addEventListener('touchmove', function(evt){
	clearLongTouchTimer();
	if (touchId !== null) {
	    for(var i=0; i<evt.changedTouches.length; i++) {
		var touch = evt.changedTouches[i];
		if (touch.identifier == touchId) {
		    cx = touch.pageX;
		    cy = touch.pageY;
		}
	    }
	}
    });
    scroll();
    return handle;
}

function makeViewer(group, centerx, centery, transformCb){
    var bbox = group.node().getBBox();
    var scrollx = -10;//bbox.x + bbox.width / 2;
    var scrolly = -100;//bbox.y + bbox.height / 2;
    var zoom = 1.0;
    function render() {
	group.attr('transform', 'translate('+centerx+','+centery+') scale('+zoom+') translate('+scrollx+','+scrolly+')');
	transformCb();
    }
    function trans(x,y) {
	scrollx += x / zoom;
	scrolly += y / zoom;
	render();
    }
    function centerOnCursor(centerCursor) {
	var area = centerCursor.node.getBoundingClientRect();
	trans(centerx - (area.right + area.left) / 2, centery - (area.bottom + area.top) / 2);
	render();
    }
    return {
	translate: trans,
	centerOnCursor: centerOnCursor,
	findCursorsContainingFn: function() { 
	    var curFnId;
	    var resultFnId;
	    wf.visitModule(runState.curModule(), {
		fn: function(fn, path) {
		    curFnId = path[0];
		},
		op: function(codeOp) {
		    if (codeOp === cursor.opident) resultFnId = curFnId;
		}
	    });
	    return resultFnId;
	},
	findCursorForOp: function(opRec) {
	    var cursors = runState.rootLayout.cursors;
	    for(var i=0; i<cursors.length; i++) {
		if (cursors[i].opident === opRec) {
		    return cursors[i];
		}
	    }
	    return undefined;
	},
	scale: function(factor) {zoom *= factor; render();},
	setContent: function(newGroup, centerCursor) {
	    group.node().parentNode.removeChild(group.node());
	    group = newGroup;
	    render();
	    if (centerCursor) {
		centerOnCursor(centerCursor);
	    }
	}
    }
}

function makeDpad(container, viewer, x, y, radius, handleRadius) {
    var group = container.append('svg:g');
    group.append('svg:circle').attr('cx',x).attr('cy',y).attr('r',radius).attr('stroke-width',3).attr('stroke','#666').attr('fill','none');
    var scrollx=0;
    var scrolly=0;
    var usableRadius = radius - handleRadius;
    function cb(dx, dy, handle) {
	var len = Math.sqrt(dx*dx + dy*dy);
	if (len > usableRadius) {
	    var shrinkFactor = usableRadius / len;
	    dx *= shrinkFactor;
	    dy *= shrinkFactor;
	}
	handle.attr('transform', 'translate('+dx+','+dy+')');
	viewer.translate(-dx / 10, -dy / 10);
    }
    var handle = makeDragHandle(group, x, y, handleRadius, cb, cursorNext);
    return group;
}

function radiansToDegrees(theta) {
    return theta * (180 / Math.PI);
}

function makeZoomPad(container, viewer, x, y, middleRadius, handleRadius, startAngle, endAngle) {
    var group = container.append('svg:g');
    group.append('svg:path').attr('d',describeArc(x, y, middleRadius, startAngle, endAngle)).attr('stroke-width',3).attr('stroke','#666').attr('fill','none')
    //group.append('svg:circle').attr('cx',x).attr('cy',y).attr('r',radius).attr('stroke-width',3).attr('stroke','#666').attr('fill','none');
    var scaleFactor = 1;
    var midAngle = (endAngle + startAngle) / 2;
    function cb(dx, dy, handle, absX, absY) {
	if (dx === 0 && dy === 0) {
	    handle.attr('transform', 'rotate('+midAngle+','+x+','+y+') translate(0,-'+middleRadius+')');
	} else {
	    var curAngle = 180-radiansToDegrees(Math.atan2(absX-x, absY-y));
	    handle.attr('transform', 'rotate('+curAngle+','+x+','+y+') translate(0,-'+middleRadius+')');
	    var pct = (curAngle - startAngle) / (endAngle - startAngle);
	    var zoomFactor = 0.9 + pct * 0.2;
	    viewer.scale(zoomFactor);
	}
    }
    var handle = makeDragHandle(group, x, y, handleRadius, cb);
    return group;
}

var env = {functions:{}, modules:{}, loading:{}};

var IDE_STATE_KEY = 'ideState.v5'
function loadIdeState() {
    var ideStateString = window.localStorage.getItem(IDE_STATE_KEY);
    if (ideStateString) {
	try {
	    return JSON.parse(ideStateString);
	} catch(e) {}
    }
    return {
	repoRoot: 'http://millstonecw.com:11739/module',
	moduleUrls: [],//'http://millstonecw.com:11739/module/e842e7e98ff94fc79dc801432c0da4f8'],
	//moduleSearchUrl: '/api/module/',
	//moduleBaseUrl: '/api/module/'
    };
}

function saveIdeState(ideState) {
    window.localStorage.setItem(IDE_STATE_KEY, JSON.stringify(runState.ideState));
}

function onTestsComplete(results) {
    runState.explorer.setTestResults(results);
    runState.explorer.updateDisplay();
}

var ideState = loadIdeState();
console.log('Loaded IDE state:', ideState);

var runState = {
    ideState: ideState,
    rootLayout: {group:codeRoot.append('svg:g'), cursors:[]},
    viewer: null,
    codeEnv: env,
    execution: setupExecutionContext(onTestsComplete),
    curModule: function() { return env.modules[ideState.moduleUrls[0]]; },
    module: function(idx) { return env.modules[ideState.moduleUrls[idx]]; }
}

function buttonArc(container, x, y, radius, startAngle, items) {
    var shelf = container.append('svg:g');
    var circumference = 2 * Math.PI * radius;
    var degreesPerPx = 360.0 / circumference;
    var angle = startAngle;
    items.forEach(function(item) {
	var button = shelf.append('svg:g');

	var angleOffset = 0;
	var curAngleOffset = 0;
	var dragStartAngle = 0;
	function dragCb(dx, dy, handle, absX, absY) {
	    if (dx === 0 && dy === 0) {
		if (curAngleOffset !== 0) {
		    angleOffset += curAngleOffset; // lock in changes from earlier rotation
		    curAngleOffset = 0;
		}
		dragStartAngle = 180 - radiansToDegrees(Math.atan2(absX-x, absY-y));
		//shelf.attr('transform', 'rotate('+startAngle+','+x+','+y+')');
	    } else {
		var curDragAngle = 180 - radiansToDegrees(Math.atan2(absX-x, absY-y));
		curAngleOffset = curDragAngle - dragStartAngle;
		shelf.attr('transform', 'rotate('+(angleOffset + curAngleOffset)+','+x+','+y+')');
		//var pct = (curAngle - startAngle) / (endAngle - startAngle);
		//var zoomFactor = 0.9 + pct * 0.2;
		//viewer.scale(zoomFactor);
	    }
	}
	

	var txtSize = 16;
	if (item.label && item.label.length === 1) txtSize = 24;
	var txt = svgText(button, x, y - radius, item.label, txtSize);

	var tapCb = function(){};

	if (item.exec) {
	    tapCb = function() {
		item.exec();
	    };
	    if (item.exec.longexec) {
		tapCb.longexec = item.exec.longexec;
	    }
	}
	var handle = makeDragHandle(button, x, y - radius, 8, dragCb, tapCb, txt);

	var angleSpan = degreesPerPx * (txt.node().getComputedTextLength() + 6);
	button.attr('text-anchor','middle').attr('transform', 'rotate('+(angle+angleSpan/2)+','+x+','+y+')');
	angle += angleSpan;
    });
    return shelf;
}

// outside border
//s.elem.append('svg:rect').attr('x','1').attr('y','1').attr('width',s.r(2)).attr('height',s.b(2)).style('fill-opacity','0').style('stroke','black').style('stroke-width',2);

// controls area
s.elem.append('svg:rect').attr('x','0').attr('y',s.topSplit).attr('width',s.r(0)).attr('height',s.bottomSplit-s.topSplit).style('fill','#ddd').style('stroke','none');

var CORE_MODULE_URL = 'http://millstonecw.com:11739/module/12db0c6b9d2a0776a3f1599b0fb40fff';

function newModule(moduleUrl, overrides) {
    var ret = {
	src_version: '0.1',
	name: '',
	refs: [{url:[CORE_MODULE_URL]}],
	workInProgress: true,
	functions: {
	    
	},
    };
    for(var key in overrides) {
	ret[key] = overrides[key];
    }
    runState.codeEnv.modules[moduleUrl] = ret;
    return ret;
}

function renumberFunctionIds(module) {
    var keyMap = {};
    var newFunctions = {};
    Object.keys(module.functions).forEach(function(oldFnId, idx) {
	var newFnId = idx.toString(16);
	newFunctions[newFnId] = module.functions[oldFnId];
    });
    module.functions = newFunctions;
}
//    renumberFunctionIds(runState.curModule());

var mainMenuDialog = document.getElementById('mainMenu');
document.getElementById('mainMenuCancel').onclick = function() { mainMenuDialog.close(); };
document.getElementById('mainMenuPublish').onclick = function() {
    var newRefs = saveModules(false);
    var urlRemap = {};
    var ideState = runState.ideState;
    ideState.moduleUrls = ideState.moduleUrls.map(function(url, idx) {
	var newUrl = nextVersionUrl(url);
	urlRemap[url] = newUrl;
	var module = runState.codeEnv.modules[url];
	var refAsSaved = newRefs[url];
	module['forkedFrom'] = {ref: refAsSaved, date: (new Date()).toISOString()};
	runState.codeEnv.modules[newUrl] = module;
	delete runState.codeEnv.modules[url];
	return newUrl;
    });
    ideState.moduleUrls.forEach(function(url, idx) {
	var module = runState.module(idx);
	module.refs.forEach(function(ref) {
	    var rewritten = urlRemap[ref.url];
	    if (rewritten) {
		ref.url = rewritten;
		ref.hash = ref.size = null;
	    }
	});
    });
    saveIdeState();
    mainMenuDialog.close();
};
document.getElementById('mainMenuSave').onclick = function() {
    saveModules(true);
    mainMenuDialog.close();
};
document.getElementById('mainMenuDelete').onclick = function() {
    var urls = runState.ideState.moduleUrls;
    var moduleUrl = urls[0];
    deleteModule(moduleUrl, function() {
	runState.ideState.moduleUrls = urls.slice(1);
	mainMenuDialog.close();
	switchModuleDisplay();
    }, function() {
	console.log('unable to delete module');
    });
};
document.getElementById('mainMenuRename').onclick = function() {
    mainMenuDialog.close();
    promptInput(function(moduleName) {
	runState.curModule().name = moduleName;
	layoutCode();
    });
};

function saveModules(workInProgress) {
    var writtenStats = {};
    // modules have to be saved in dependency order
    var remaining = ideState.moduleUrls.slice();
    while(true) {
	var remainingInitially = remaining.length;
	remaining = remaining.filter(function(moduleUrl, idx) {
	    var module = runState.module(idx);
	    var hasPendingDependencies = false;
	    module.refs.forEach(function(ref) {
		if (writtenStats[ref.url] !== undefined) return;
		if (ideState.moduleUrls.indexOf(ref.url) === -1) return;
		hasPendingDependencies = true;
	    });
	    if (! hasPendingDependencies) {
		module['workInProgress'] = workInProgress;
		writtenStats[moduleUrl] = saveModule(moduleUrl, module, function() {
		    console.log("saved ", moduleUrl, " wip=", workInProgress);
		});
	    }
	    return hasPendingDependencies;
	});
	if (remaining.length === 0) break;
	if (remaining.length === remainingInitially) {
	    throw Error('Circular dependency detected');
	}
    }
    return writtenStats;
}

function switchModuleDisplay() {
    saveIdeState();
    runState.rootLayout = layoutModule();
    runState.controls.regenModuleButtons();
    cursor = runState.rootLayout.cursors[0];
    runState.viewer.setContent(runState.rootLayout.group, cursor);
}

function makeNewModuleAndSwitch(params) {
    var moduleUrl = runState.ideState.repoRoot + '/' + uuid();
    var module = newModule(moduleUrl, params);
    saveModule(moduleUrl, module, function() {
	runState.ideState.moduleUrls.splice(0, 0, moduleUrl);
	switchModuleDisplay();
    });
}

var searchBox = document.getElementById('openModuleDialogSearch');
var resultList = document.getElementById('openModuleDialogResults');
var openModuleDialog = document.getElementById('openModuleDialog');
var moduleActionDialog = document.getElementById('moduleActionDialog');

var openAction = null;
function moduleSearcher(type) {
    return function() {
	openAction = type;
	searchBox.value = '';
	mainMenuDialog.close();
	openModuleDialog.show();
	searchBox.focus();
    }
};
function domClear(container) {
    while (container.firstChild) {
	container.removeChild(container.firstChild);
    }
}

setupInput(searchBox, function() {
    var searchString = searchBox.value;
    var ideState = runState.ideState;
    searchModules(ideState.repoRoot, searchString, function(hits) {
	domClear(resultList);
	hits.forEach(function(hit) {
	    var li = document.createElement('li');
	    li.textContent = hit.name + ' ' + (hit['forkedFrom'] || {})['date'];
	    resultList.appendChild(li);
	    li.onclick = function() {
		var url = ideState.repoRoot+'/'+hit.id;
		loadModule(url, env, function() {
		    var module = runState.codeEnv.modules[url];
		    openModuleDialog.close();
		    var options = {
			edit: function() {
			    ideState.moduleUrls.splice(0, 0, url);
			    switchModuleDisplay();
			},
			extend: function() {
			    var refs = [{url:CORE_MODULE_URL}, {url:url}];
			    var oldFunctions = module.functions;
			    var newFunctions = {};
			    Object.keys(oldFunctions).forEach(function(fnId) {
				var oldFn = oldFunctions[fnId];
				var fn = {
				    tags: [],
				    condition: [{"op":"literal", "val":true}],
				    code:[],
				    numConsumed: oldFn.numConsumed,
				    numProduced: oldFn.numProduced,
				    name: oldFn.name,
				    overrides: '1:' + fnId
				};
				newFunctions[fnId] = fn;
			    });
			    makeNewModuleAndSwitch({
				name: module.name,
				refs: refs,
				functions: newFunctions,
			    });
			},
			include: function() {
			    var refs = runState.curModule().refs;
			    if (typeof url !== 'string') throw new Error('eh? '+url);
			    refs.push({url: url});
			    runState.controls.regenModuleButtons();
			}
		    };
		    options[openAction]();
		    openAction = null;
		}, function(err) {
		    console.log('unable to load module: '+err);
                    openModuleDialog.close();
		});
	    };
	});
    });
});
document.getElementById('mainMenuOpen').onclick = function() {
    mainMenuDialog.close();
    promptInput(function(moduleUrl) {
	loadModule(moduleUrl, runState.codeEnv, function() {
	    ideState.moduleUrls.splice(0, 0, moduleUrl);
            switchModuleDisplay();
	});
    });
};
document.getElementById('mainMenuSearch').onclick = moduleSearcher('edit');
document.getElementById('mainMenuExtend').onclick = moduleSearcher('extend');
document.getElementById('mainMenuInclude').onclick = moduleSearcher('include');

document.getElementById('mainMenuNewFunction').onclick = function() {
    mainMenuDialog.close();
    newFunction();
};
document.getElementById('mainMenuNew').onclick = function() {
    mainMenuDialog.close();
    promptInput(function(moduleName) {
	if (! moduleName) return;
	makeNewModuleAndSwitch({name: moduleName});
    });
};
document.getElementById('mainMenuClose').onclick = function() {
    var modules = runState.ideState.moduleUrls;
    runState.ideState.moduleUrls = modules.slice(1, modules.length);
    mainMenuDialog.close();
    switchModuleDisplay();
};
document.getElementById('mainMenuNext').onclick = function() {
    var modules = runState.ideState.moduleUrls;
    var cur = modules[0];
    modules = modules.slice(1, modules.length);
    modules.push(cur);
    runState.ideState.moduleUrls = modules;
    mainMenuDialog.close();
    switchModuleDisplay();
};
document.getElementById('openModuleDialogCancel').onclick = function() {
    openModuleDialog.close();
};
var menuButton = svgText(s.elem, 5, 22, "\u2630", 24);
menuButton.node().onclick = function() { mainMenuDialog.showModal(); };


var cursorElem = {'x':s.elem.append('svg:line').attr('fill','none').attr('stroke','none'),
		  'y':s.elem.append('svg:line').attr('fill','none').attr('stroke','none')};
var centerX = s.r(0) / 2;
var centerY = s.topSplit / 2;
var cursor = null;

function transformCb() {
    var oldCursor = cursor;
    cursor = null;
    var minCursorDistance = 100000;
    var cursorBBox = null;
    runState.rootLayout.cursors.forEach(function(candidate) {
	var bbox = candidate.node.getBoundingClientRect();
	var dx = 0.0;
	var dy = 0.0;
	if (centerX < bbox.left)   dx = bbox.left   - centerX;
	if (centerX > bbox.right)  dx = bbox.right  - centerX;
	if (centerY < bbox.top)    dy = bbox.top    - centerY
	if (centerY > bbox.bottom) dy = bbox.bottom - centerY;
	var curDist = dx*dx + dy*dy;
	if (curDist < minCursorDistance) {
	    cursorBBox = bbox;
	    cursor = candidate;
	    minCursorDistance = curDist;
	}
    });
    if (cursor !== null) {
	cursorElem.y.attr('stroke','#777').attr('x1',cursorBBox.left).attr('y1',cursorBBox.bottom).attr('x2',cursorBBox.left).attr('y2',cursorBBox.top);
	cursorElem.x.attr('stroke','#777').attr('x1',cursorBBox.left).attr('y1',cursorBBox.bottom).attr('x2',cursorBBox.right).attr('y2',cursorBBox.bottom);
    }
    if (cursor !== oldCursor) {
	if (cursor === null) {
	    cursorElem.x.attr('stroke','none');
	    cursorElem.y.attr('stroke','none');
	}
	if (cursor && cursor.optype != (oldCursor||{}).optype) {
	    runState.controls.setMode(cursor.optype);
	}
	runState.explorer.updateDisplay();
    }
}

function setupCodeRoot(centerx, centery) {
    codeRoot.append('svg:circle').attr('cx',centerx).attr('cy',centery).attr('r',16).attr('stroke-width',14).attr('stroke-opacity',0.1).attr('stroke','#999').attr('fill','none');
    runState.viewer = makeViewer(runState.rootLayout.group, centerx, centery, transformCb);
}
setupCodeRoot(s.r(0)/2, s.topSplit/2);

function setupExecutionContext(onTestComplete) {
    var curTestRun = null;
    var curTestResults = null;
    function triggerTests() {
	if (curTestRun) {
	    clearTimeout(curTestRun);
	    curTestRun = null;
	    return;
	}
	curTestRun = setTimeout(runTests);
    }
    function runTests() {
	clearTimeout(curTestRun);
	curTestRun = null;
	var ret = {ok:true, modules:{}};
	runState.ideState.moduleUrls.forEach(function(moduleUrl) {
	    var module = runState.codeEnv.modules[moduleUrl];
	    var moduleTestResults = ret.modules[moduleUrl] = {ok:true, functions:{}};
	    Object.keys(module.functions).forEach(function(fnId) {
		var fn = module.functions[fnId];
		if (fn.tags.indexOf('assert') === -1) return;
		if (fn.numConsumed > 0) return;
		var testResult = runTest(moduleUrl, fnId);
		fn._wft_test_trace = testResult.trace;
		moduleTestResults.functions[fnId] = testResult;
		if (! testResult.ok) moduleTestResults.ok = false;
	    });
	    if (! moduleTestResults.ok) ret.ok = false;
	});
	curTestResults = ret;
	onTestComplete(curTestResults);
    }
    return {
	triggerTests: triggerTests
    };
}

function layoutCode() {
    var env = runState.codeEnv;
    runState.rootLayout = layoutModule();
    if (cursor) {
	var options = runState.rootLayout.cursors.filter(function(c){return c.opident === cursor.opident});
	cursor = options[0];
	runState.viewer.setContent(runState.rootLayout.group, cursor);
    }
    runState.execution.triggerTests();
}

function cursorNext() {
    if (cursor.onNext) {
	cursor.onNext();
    }	
    var idx = runState.rootLayout.cursors.indexOf(cursor);
    if (idx == runState.rootLayout.cursors.length) {
	idx = 0;
    } else {
	idx += 1;
    }
    runState.viewer.centerOnCursor(runState.rootLayout.cursors[idx]);
}

function cursorIsAtTail() {
    return (cursor.opident === cursor.opcontainer);
}

function insertAtCursor(codeItem, dontadvance) {
    var oldIdx = runState.rootLayout.cursors.indexOf(cursor);
    if (cursorIsAtTail()) {
	cursor.opcontainer.push(codeItem);
    } else {
	var idx = cursor.opcontainer.indexOf(cursor.opident);
	cursor.opcontainer.splice(idx, 0, codeItem);
    }
    layoutCode();
    if (dontadvance) {
	runState.viewer.centerOnCursor(runState.rootLayout.cursors[oldIdx]);
    }
}

function setupInput(input, cb) {
    input.onkeypress = function(e) {
	if (!e) e = window.event;
        var keyCode = e.keyCode || e.which;
        if (keyCode == '13'){
            input.blur();
            return false;
        }
    };
    input.addEventListener('blur', cb);
    return input;
}

function promptInput(cb, startText, type) {
    var input = document.createElement('input');
    input.setAttribute('type', type || 'text');
    input.setAttribute('style', 'display:block; position:absolute; left:10%; top:5%; width:80%');
    input.setAttribute('autocapitalize', 'none');
    input.setAttribute('autocorrect', 'none');
    if (startText) {
	input.setAttribute('value', startText);
    }
    function accept() {
	cb(input.value);
	document.body.removeChild(input);
    }
    setupInput(input, accept);
    document.body.appendChild(input);
    input.focus();
}

function saveVar() {
    promptInput(function(val) {
	if (val) {
	    insertAtCursor({'op':'save','name':val});
	}
    });
}

function loadVar() {
    promptInput(function(val) {
	if (val) {
	    insertAtCursor({'op':'load','name':val});
	}
    });
}

function literalAdder(val) {
    return function() {
	insertAtCursor({'op':'literal','val':val});
	runState.controls.setMode('op');
    };
}

function newString() {
    promptInput(function(val) {
	insertAtCursor({'op':'literal','val':val});
	runState.controls.setMode('op');
    });
}

function newNumber() {
    promptInput(function(val){
	if (val) {
	    insertAtCursor({'op':'literal','val':parseFloat(val)});
	}
	runState.controls.setMode('op');
    }, '', 'tel');
}

function newCond() {
    var conditionCode = [];
    insertAtCursor({
	op: 'cond',
	branches: [
	    {condition: conditionCode, code: []}
	]
    }, true);
    cursor = {opident: conditionCode, opcontainer: conditionCode, optype:'function'};


    runState.controls.setMode('op');
}

function newLambda() {
    insertAtCursor({
	op: 'lambda',
	code: []
    }, true);
    runState.controls.setMode('op');
    
}

function newCallLambda() {
    showCallLambdaDialog(function(rec) {
	rec.op = 'callLambda'
	insertAtCursor(rec);
	runState.controls.setMode('op');
    });
}

function newInterface() {
    var starterFn = {condition:[{op:'literal', val:false}]};
    return showInterfaceDialog(starterFn, basicFunction);
}

function showInterfaceDialog(fn, cb) {
    var interfaceDialog = document.getElementById('interfaceDialog');
    var nameBox = document.getElementById('interfaceDialogName');
    var numInputsBox = document.getElementById('interfaceDialogNumInputs');
    var numOutputsBox = document.getElementById('interfaceDialogNumOutputs');
    var saveButton = document.getElementById('interfaceDialogSaveButton');
    nameBox.value = fn.name || '';
    numInputsBox.value = fn.numConsumed || '';
    numOutputsBox.value = fn.numProduced || '';
    saveButton.onclick = function() {
	fn.name = nameBox.value;
	fn.numConsumed = parseInt(numInputsBox.value);
	fn.numProduced = parseInt(numOutputsBox.value);
	cb(fn);
	interfaceDialog.close();
    }
    interfaceDialog.show();
    nameBox.focus();
}

function showCallLambdaDialog(cb) {
    var dialog = document.getElementById('callLambdaDialog');
    var numInputsBox = document.getElementById('callLambdaDialogNumInputs');
    var numOutputsBox = document.getElementById('callLambdaDialogNumOutputs');
    var doneButton = document.getElementById('callLambdaDialogDoneButton');
    doneButton.onclick = function() {
	cb({numConsumed: parseInt(numInputsBox.value),
            numProduced: parseInt(numOutputsBox.value)});
	dialog.close();
    };
    dialog.show();
    numInputsBox.focus();
}

function basicFunction(values) {
    var newid = uuid();
    var fn = {
	tags: [],
	refs:[],
	numConsumed: 0,
	numProduced: 0,
	condition: [{"op":"literal", "val":true}],
	code:[],
    };
    for (var key in values) {
	fn[key] = values[key];
    }
    runState.curModule().functions[newid] = fn;
    cursor = {opident: fn.code, opcontainer: fn.code, optype:'op'};
    layoutCode();
    return fn;
}

function newFunction() {
    promptInput(function(name) {
	if (name) {
	    basicFunction({name: name});
	}
    });
}

function newAssert() {
    basicFunction({tags:['assert']});
}

function getFunctionId(fn, fnMap) {
    for(var k in fnMap) {
	if (fnMap[k] === fn) return k;
    }
    throw new Error("Function not found");
}

function resolveFn(op, module) {
    var idx = op.indexOf(':');
    var fnId = null;
    var url = undefined;
    if (idx == -1) {
	fnId = op;
    } else {
	url = module.refs[parseInt(op.substring(0,idx))].url;
	module = runState.codeEnv.modules[url];
	fnId = op.substring(idx + 1);
    }
    return {
	module: module, 
 	fnId: fnId, 
	fn: module.functions[fnId],
	moduleUrl: url, // note this is undefined if it's a local reference
    };
}

function lookupFunction(moduleUrl, fnId) {
    return runState.codeEnv.modules[moduleUrl].functions[fnId];
}

function newImplementation(fn, fnId) {
    return basicFunction({name:fn.name, overrides:fnId});
}

function editFunctionName() {
    promptInput(function(n){
	cursor.opident.name=n;
	layoutCode();
    }, cursor.opident.name);
}

function editFunctionId() {
    var fId = getCursorFunctionId();
    promptInput(function(newId){
	if (newId) {
	    delete cursor.opcontainer[fId];
	    cursor.opcontainer[newId] = cursor.opident;
	}
	layoutCode();
    }, fId);
}

function editFunctionTags() {
    promptInput(function(tagsString){
	cursor.opident.tags = tagsString.split(/[ ,]+/);
	layoutCode();
    }, (cursor.opident.tags||[]).join(' '));
}

var editNativeDialog = document.getElementById('editNativeDialog');
var editNativeCodeBox = document.getElementById('editNativeDialogCode');
document.getElementById('editNativeDialogCancel').onclick = function() { editNativeDialog.close(); };
document.getElementById('editNativeDialogSave').onclick = function() {
    var fn = cursor.opident;
    fn.nativeCode = JSON.parse(editNativeCodeBox.value)
    editNativeDialog.close();
};
function editNative() {
    var fn = cursor.opident;
    if (fn.nativeCode) {
	editNativeCodeBox.value = JSON.stringify(fn.nativeCode);
    } else {
	editNativeCodeBox.value = '';
	fn.nativeCode = fn.nativeCode || {};
    }
    editNativeDialog.show();
}

function callAdder(opid) {
    var cb = function() {
	insertAtCursor({'op':opid});
	runState.controls.setMode('op');
    };
    cb.longexec = function() {
	var fnRec = resolveFn(opid, runState.curModule());
	newImplementation(fnRec.fn, fnRec.fnId);
	runState.controls.setMode('op');
    };
    return cb;
}

function getCursorFunctionId() {
    var target = cursor.opident;
    var functions = cursor.opcontainer;
    for(var fId in functions) {
	if (target === functions[fId]) return fId;
    }
    return null;
}

function lookupIdFromFunction(functions, fn) {
    var keys = Object.keys(functions);
    for(var i=0; i<keys.length; i++) {
	var key = keys[i];
	if (fn === functions[key]) return key;
    }
    return null;
}

function removeFromArray(item, arr) {
    for(var i=0; i<arr.length; i++) {
	if (item === arr[i]) {
	    arr.splice(i, 1);
	    return;
	}
    }
    console.log('Item not present in array: ', item, ' arr:', arr);
    throw new Error('Not present in array');
}

function cutOrCopy() {
    if (cursorIsAtTail()) return;
    var target = cursor.opident;
    if (cursor.optype === 'op') {
	removeFromArray(target, cursor.opcontainer);
	var allCursors = runState.rootLayout.cursors
	var globalIdx = allCursors.indexOf(cursor);
	cursor = allCursors[(globalIdx + 1) % allCursors.length];
    } else if (cursor.optype === 'function') {
	var functions = cursor.opcontainer;
	var fnId = lookupIdFromFunction(functions, cursor.opident);
	delete functions[fnId];
    }
    layoutCode();
}

function undoOrRedo() {
}

/*
                       1234567 1234567 1234567 1234567 1234567 1234567 1234567 1234567 1234567 1234567
        boolean:       if      t/e/c   and     or      !       =       <       >               ... all any
        predicate:     isStr   isNum   isBool  isArr   isObj   isItrbl isIn
        constructor:   "..     #..     T       F       null    []      {}      `(quot)         ... "", 0, 1
        math:          +       -       *       /                                               ... range, mod
        compound:      get     ,(add)  ,:(+kv) ::      ins     pop     chop    r(ight) size    ... keysFor
        higherorder:   map     filter  split   reduce  fold    while   zip
        navigation:    kill    drop    raise   swap    dup     swap2   dup2    save    load

compunds:
  add : add a value to a compound (compound, value) -> (compound)
  pop : removes a value from a compound (compound) -> (compound, value)
  ins : add an index or key and a value to a compound (compound, key, value) -> (compound)
  get : with an index or key, gets a single value (compound, key) -> (compound', value)
  join : combine two compounds (compound, compound) -> (compound)
  split : divide compound at an index or key (compound, key) -> (compound, compound)
  r : integer variant that's measured from the right side of the compound (key) -> (key)
  size : (compound) -> (int)
  
*/


// TODO I think startModuleUrl and startFnId may always be equal to what's at the top of callStack, might remove
function findOriginOfValue(value, executor, savedTrace, callStack) {
    var startStack = callStack[callStack.length - 1].stack;
    var optraceData = [];
    var stackitem = callStack[callStack.length - 1];
    var startModuleUrl = stackitem.moduleUrl;
    var startFnId = stackitem.fnId;
    console.log('trace executing {', startFnId);
    executor(startModuleUrl, startFnId, startStack, wf.makeCachedTracer(savedTrace, optraceData));
    console.log('trace executing }', startFnId);

    function descendInto(index) {
	var opRec = optraceData[index][0];
	var opInputs = optraceData[index][1];
	if (wf.isFunctionCall(opRec.op)) {
	    var resolved = opRec._resolved;
	    var fn = runState.codeEnv.modules[resolved[0]].functions[resolved[1]];
	    if (fn.nativeCode && fn.nativeCode[wf.interpreterId]) {
		return opRec;
	    }
	    //var resolved = resolveFn(opRec.op, runState.codeEnv.modules[startModuleUrl]);
	    console.log('found fn call resolved:', resolved);
	    console.log('found fn call inputs as rememebered:', wf.stackToWfList(opInputs).toJS());
	    callStack.push({moduleUrl:resolved[0], fnId:resolved[1], stack:opInputs, opRec:opRec});
	    return findOriginOfValue(value, executor, savedTrace, callStack);
	} else {
	    return opRec;
	}
    }

    for(var i=0; i<optraceData.length; i++) {
	var pair = optraceData[i];
	var opRec = pair[0];
	var stack = pair[1];
	var path = wf.findValueIn(value, wf.stackToWfList(stack));
	console.log('find origin itr ', opRec.op, ' foundpath: ',path);
	if (path === undefined) continue;
	if (i === 0) { 
	    callStack.pop();
	    return findOriginOfValue(value, executor, savedTrace, callStack);
    	    //return opRec; // since the beginning, just give the start op?
	} else { // the previous op would be the one that added the value
	    return descendInto(i - 1);
	}
    }
    // value must have been create at the very end (hopefully)
    return descendInto(optraceData.length - 1);
}

function setupExplorer() { // thing at the bottom that shows data structures
    var dims = {x:0, y:s.bottomSplit, width:s.r(0), height: s.b(0) - s.bottomSplit};
    var background = s.elem.append('svg:rect').attr('x',dims.x).attr('y',dims.y).attr('width',dims.width).attr('height',dims.height).style('fill','#eee').style('stroke','none');
    var container = s.elem.append('svg:g');
    var testResults = {modules:{}};
    
    // these relate to a specific execution context:
    var executor, trace;
    var callStack = [];

    function showTestData(moduleUrl, fnId, opRec) {
	callStack = [];
	var moduleTests = testResults.modules[moduleUrl];
	if (! moduleTests) return;
	var test = moduleTests.functions[fnId];
	if (! test) return;
	callStack.push({moduleUrl: moduleUrl, fnId:fnId, stack:wf.emptyStack(), opRec:opRec});
	executor = test.executor;
	trace = test.trace;
	return showExecutionData();
    }
    function showExecutionDataAt(moduleUrl, fnId, opRec) {
	while(callStack.length > 0) {
	    var stackItem = callStack[callStack.length - 1];
	    if (stackItem.moduleUrl === moduleUrl && stackItem.fnId === fnId) {
		if (opRec !== stackItem.opRec) {
		    stackItem.opRec = opRec;
		    showExecutionData();
		}
		return;
	    } else {
		return;
		// not right with lambdas:
		console.log('POPPING CALLSTACK ', JSON.stringify(callStack[callStack.length - 1]));
		callStack.pop();
	    }
	}
	clearDisplay();
    }
    function showExecutionData() {
	var stackitem = callStack[callStack.length - 1];
	console.log('showexecutiondata callstacktop', stackitem);
	var moduleUrl = stackitem.moduleUrl;
	var fnId = stackitem.fnId;
	var opRec = cursor.opident;//stackitem.opRec;
	var optraceData = [];
	var tracer = wf.makeCachedTracer(trace, optraceData);
	executor(moduleUrl, fnId, stackitem.stack, tracer);
	var thisPair = optraceData.filter(function(pair) { return pair[0] === opRec; });
	// TODO this can produce multiple hits for a lambda
	clearDisplay();
	if (thisPair.length > 0) {
	    var originCb = function(data) {
		var origin = findOriginOfValue(data, executor, trace, callStack);
		console.log('ORIGIN', origin, ' from data ', data);
		var newCursor = runState.viewer.findCursorForOp(origin);
		if (newCursor) {
		    runState.viewer.centerOnCursor(newCursor);
		    showExecutionData();
		} else {
		    console.log('Unable to find cursor for origin: ', origin);
		}
	    };
	    var stackData = wf.stackToWfList(thisPair[0][1]).reverse(); // top item on right
	    layoutData(container, stackData, dims, {origin: originCb});
	}
    }
    function clearDisplay() {
	domClear(container.node());
    }
    return {
	setTestResults: function(r) {
	    testResults = r;
	},
	updateDisplay: function() {
	    console.log('explorer: updateDisplay() callstack:', callStack);
	    var curFnId = runState.viewer.findCursorsContainingFn();
	    if (curFnId) {
		var curModuleUrl = runState.ideState.moduleUrls[0];
		if (callStack.length > 0) {
		    showExecutionDataAt(curModuleUrl, curFnId, cursor.opident);
		} else {
		    showTestData(curModuleUrl, curFnId, cursor.opident);
		}
	    } else {
		clearDisplay();
	    }
	},
	showTestData: showTestData,
    };
}



function setupControls() {
    var yCentroid = s.bottomSplit + 70;
    var fnMenu1 = buttonArc(s.elem,  s.r(0), yCentroid, 163, -65, [//-68, [
	{label:'infc', exec:newInterface},
	{label:'new', exec:newFunction},
	{label:'asrt', exec:newAssert},
	{label:'name', exec:editFunctionName},
	{label:'id', exec:editFunctionId},
	{label:'tags', exec:editFunctionTags},
	{label:'ntv', exec:editNative},
    ]);

    var opMenu0 = buttonArc(s.elem, s.r(0), yCentroid, 97, -45, [
	{label:'c/c', exec:cutOrCopy},
	{label:'undo', exec:undoOrRedo}
    ]);
    
    var opMenu1 = buttonArc(s.elem,  s.r(0), yCentroid, 155, -63, [//-68, [
	{label:'sav', exec:saveVar},
	{label:'lod', exec:loadVar},
	//{label:'rse'},
	//{label:'drp'},
    ].concat(buttonsForModule(moduleForRef(0), 0, 'navigation')));
    
    var opMenu2 = buttonArc(s.elem,  s.r(0), yCentroid, 178, -68, [
	{label:'bln', exec:moduleMenu(0, 'boolean', [{label:'cond', exec:newCond}])},
	{label:'prd', exec:moduleMenu(0, 'predicate')},
	{label:'mth', exec:moduleMenu(0, 'math', [
	    {label:'0', exec:literalAdder(0)},
	    //{label:'1', exec:literalAdder(1)},
	    {label:'#..', exec:newNumber},
	])},
	{label:'new', exec:moduleMenu(0, 'constructor', [
	    {label:'""', exec:literalAdder("")},
	    {label:'".."', exec:newString}, 
	    {label:'null', exec:literalAdder(null)},
	    {label:'true', exec:literalAdder(true)},
	    {label:'false', exec:literalAdder(false)},
	    {label:'[]', exec:literalAdder([])},
	    {label:'{}', exec:literalAdder({})},
	])},
	{label:'cpd', exec:moduleMenu(0, 'compound')},
	{label:'hgh', exec:moduleMenu(0, 'higherorder', [{label:'lmd', exec:newLambda}, {label:'call', exec:newCallLambda}])},
    ]);

    function moduleMenuButtonArc(){
	return buttonArc(s.elem, s.r(0), yCentroid, 200, -70, genModuleMenuButtons());
    }
    
    function genModuleMenuButtons() {
	var curModule = runState.curModule();
	var buttons = [];
	if (curModule) {
	    curModule.refs.forEach(function(ref, idx) {
		var module;
		if (idx === 0) {
		    // ignore core module but add ourself in at fake index -1
		    module = curModule;
		    idx = -1;
		} else {
		    module = runState.codeEnv.modules[ref.url];
		}
		buttons.push({label: module.name,
			      exec: moduleMenu(idx)});
	    });
	}
	return buttons;
    }

    var dPad = makeDpad(s.elem, runState.viewer, s.l(70), s.bottomSplit - 70, 68, 30);
    var zPad = makeZoomPad(s.elem, runState.viewer, s.r(0), s.bottomSplit + 70, 130, 14, 303, 359);
    var modeElements = {
	'op': [dPad, opMenu1, opMenu2, moduleMenuButtonArc()],
	'function': [dPad, fnMenu1],
	'module': [],
	'': [],
    }
    var dynamicElements = [];
    for(var k in modeElements) {
	modeElements[k].forEach(function(elem){
	    elem.attr('display','none');
	})
    }
    function regenModuleButtons() {
	var opMenu3 = modeElements['op'].pop();
	s.elem.node().removeChild(opMenu3.node());
	modeElements['op'].push(moduleMenuButtonArc());
    }
    
    var curMode = ''
    function setMode(newMode, extras) {
	console.log('setmode from:', curMode, ' to:', newMode, extras);
	if (curMode == newMode) return;
	modeElements[curMode].forEach(function(elem) {
	    elem.attr('display','none');
	});
	if (dynamicElements.length > 0) {
	    dynamicElements.forEach(function(elem) {
		s.elem.node().removeChild(elem.node());
	    });
	    dynamicElements = [];
	}
	modeElements[newMode].forEach(function(elem) {
	    elem.attr('display','inherit');
	});
	if (extras !== undefined) {
	    extras.forEach(function(elem) {
		dynamicElements.push(elem);
	    });
	}
	curMode = newMode;
    }
    function moduleForRef(refIndex) {
	var curModule = runState.curModule();
	if (refIndex == -1) {
	    return curModule;
	} else if (curModule) {
	    var ref = curModule.refs[refIndex];
	    if (ref !== undefined) {
		var moduleUrl = ref.url;
		return runState.codeEnv.modules[moduleUrl];
	    }
	}
    }
    function buttonsForModule(module, moduleIndex, tag) {
	if (! module) return [];
	var functions = module.functions;
	var fids = Object.keys(functions);
	if (tag) {
	    fids = fids.filter(function(fid){return functions[fid].tags.indexOf(tag) != -1;});
	}
	return fids.map(function(fid) {
	    var cb = (moduleIndex === -1) ? callAdder(fid) : callAdder(moduleIndex+':'+fid);
	    return {label:functions[fid].name, exec:cb};
	});
    }
    function moduleMenu(moduleIndex, tag, extras) {
	return function() {
	    var module = moduleForRef(moduleIndex);
	    var buttons;
	    if (module !== null) {
		var buttons = buttonsForModule(module, moduleIndex, tag);
	    } else {
		buttons = [];
	    }
	    if (extras) {
		buttons = extras.concat(buttons);
	    }
	    var menu = buttonArc(s.elem,  s.l(0), s.bottomSplit+100, 220, 0, buttons);
	    var cancelButton = svgText(s.elem, s.l(5), s.bottomSplit - 5, '\u27A1', 16);
	    cancelButton.node().addEventListener('click', function() { setMode('op'); });
	    setMode('module', [menu, cancelButton]);
	};
    }

    return {
	setMode: setMode,
	regenModuleButtons: regenModuleButtons,
    };
}

var modulesToLoad = [wf.platformImplUrl].concat(ideState.moduleUrls);
loadModules(modulesToLoad, env, function() {
    //switchModuleDisplay();
    runState.controls = setupControls();
    runState.explorer = setupExplorer();
    runState.rootLayout = layoutModule();
    runState.controls.regenModuleButtons();
    runState.viewer.setContent(runState.rootLayout.group, runState.rootLayout.cursors[0]);
    runState.execution.triggerTests();
    runState.controls.setMode('op');
});

function makeResolver() {
    var modules = runState.codeEnv.modules;
    return {
	resolve: function(moduleId) { return modules[moduleId]; },
	moduleId:function(ref) { return ref.url; },//makesha(JSON.stringify(modules[ref.url])); },
    };
}

function prepareWf(moduleUrl) {
    return wf.prepare(moduleUrl, makeResolver(), [wf.platformImplUrl]);
}

function runTest(moduleUrl, fnId) {
    var executor = prepareWf(moduleUrl); 
    var tracer = wf.makeSavingTracer();
    var resultStack = executor(moduleUrl, fnId, wf.emptyStack(), tracer);
    return {'ok': resultStack.length === 1 && !!resultStack[0], 'trace': tracer, 'executor': executor}
}

