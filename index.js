// !preview r2d3 data=data, options = list(significance_thresh = 1e-3, color_key = category_colors), container = 'div', dependencies = 'd3-jetpack'
//
// r2d3: https://rstudio.github.io/r2d3
//

const svg = div.selectAppend('svg').at({width,height});
// These aren't shown in the tooltip. 
const ommitted_props = ['x', 'y', 'log10_p_val', 'color', 'index', 'p_val'];
const margin = ({top: 20, right: 60, bottom: 30, left: 40});
const tooltip_offset = 5;
const point_size = 5;
const {significance_thresh} = options;

const pval_formatter = d3.format(".2e");

const tooltip_style = {
  background:'white',
  borderRadius: '10px',
  padding: '0px 10px 10px 10px',
  boxShadow: '1px 1px 3px black',
  position:'fixed',
  top: d => `${d.y}px`,
  left:d => `${d.x}px`,
};

const popup_style = {
  background:'rgba(255,255,255,0.7)',
  position:'fixed',
  textAlign: 'center',
  fontSize: 18,
};

const delete_button_style = {
  borderRadius: '10px',
  opacity: 0,
  padding: '2px',
  marginTop: '3px',
  marginRight: '-7px',
  backgroundColor: 'indianred',
  textAlign : 'center',
  width: '30px',
  color: 'white',
};


// Small popup tooltip
const popup = div.selectAppend('div.popup')
  .st(popup_style);

let tooltips = [];


const log10_pval_max = d3.max(data, (d,i) => {
    // Add properties to data
    d.log10_p_val = -Math.log10(d.p_val);
    d['P-Value'] = pval_formatter(d.p_val);
    d.index = i;
    // Return property to max function
    return d.log10_p_val;
  });

const log10_threshold = -Math.log10(significance_thresh);
  
const y = d3.scaleLinear()
  .domain([0,Math.max(log10_threshold, log10_pval_max)]).nice()
  .range([height - margin.bottom, margin.top]);

svg.append("g")
  .call(function(g){
    g
     .attr("transform", `translate(${margin.left},0)`)
     .call(d3.axisLeft(y).tickSizeOuter(0));
  });

const x = d3.scaleLinear()
  .domain([0, data.length])
  .range([margin.left, width - margin.right]);


const codes = svg.selectAppend('g.code_bubbles')
  .selectAll('.code_bubble')
  .data(data)
  .enter().append('circle')
  .at({
    cx: d => x(d.index),
    cy: d => y(d.log10_p_val),
    fill: d => d.color,
    r: point_size,
    title: d => d.code,
  })
  .on('click', addTooltip(false))
  .on('mouseover', function(d){
    popup
     .st({
       left: d3.event.clientX + tooltip_offset*2,
       top: d3.event.clientY + tooltip_offset,
       display: 'block'
     })
     .html(`<strong>Code:</strong> ${d.code}`);
  })
  .on('mouseout', function(d){
    popup.style('display', 'none');
  });
  
// Draw significance line on y-axis
significance_line = svg.selectAppend('g.significance_line')
  .translate([0,y(-Math.log10(significance_thresh))]);
  
significance_line.selectAppend('line')
  .at({
    x1: margin.left,
    x2: width - margin.right,
    stroke: 'black',
    strokeWidth: 1,
  });
  
significance_line.selectAppend('text')
  .at({
    x: width - margin.right,
    fontAlign: 'left',
    fontSize: 18
  })
  .text(pval_formatter(significance_thresh));


function addTooltip(pin){
  return function(d){
    d.y = d3.event.clientY + tooltip_offset;
    d.x = d3.event.clientX + tooltip_offset;
   
    // check if we already have an active tooltip for the selected code. 
    if(!tooltips.find(code => code.code == d.code)){
      tooltips.push(d);
      drawTooltips(tooltips);  
    }
  };
}

function htmlFromProps(code){
  return Object.keys(code)
    .filter(prop => !ommitted_props.includes(prop))
    .reduce(
      (accum, curr, i) => accum + `<strong>${curr}:</strong> ${curr === 'p_val' ? pval_formatter(code[curr]) : code[curr]} </br>`,
      ''
    );
}

function drawTooltips(tooltips){
  
  const tooltip_lines = svg.selectAll('.tooltip_line')
    .data(tooltips, d => d.code);
    
  tooltip_lines.enter().append('line')
    .at({
      x1: d => x(d.index),
      y1: d => y(d.log10_p_val),
      x2: d => d.x,
      y2: d => d.y,
      id: d => codeToId(d.code),
      stroke: 'black',
      strokeWidth: '1px',
    })
    .classed('tooltip_line', true);
  
  tooltip_lines.exit().remove();
    
  const tooltip_divs = div.selectAll('.annotation')
    .data(tooltips, d => d.code);
    
  const drawn_tips = tooltip_divs.enter()
    .append('div.annotation')
    .st(tooltip_style)
    .on('mouseover', function(){
      d3.select(this).select('button').style('opacity', 1);
    })
    .on('mouseout', function(){
      d3.select(this).select('button').style('opacity', 0);
    })
    .call(
      d3.drag()
        .on('start.interrupt', function(){
          // logic can go here if needed 
        })
        .on('start drag', function(d){
          const {x, y} = d3.event;
          d.x = x + tooltip_offset;
          d.y = y + tooltip_offset;

          d3.select(this).st({  
            top: `${d.y}px`,
            left:`${d.x}px`,
          });
          
          svg.select(`#${codeToId(d.code)}`).at({  
            x2: d.x,
            y2: d.y,
          });
        })
      );
    
   drawn_tips
    .append('div')
    .st({
      textAlign: 'right',
      height: '10px'    
    })
      .append('button')
      .text('X')
      .st(delete_button_style)
      .on('click', function(current){
        const toDeleteIndex = tooltips.reduce((place, d, i) => d.code === current.code ? i : place, -1);
        tooltips.splice(toDeleteIndex, 1);
        svg.select(`#${codeToId(current.code)}`).remove();
        drawTooltips(tooltips);
      });
    
    drawn_tips.append('div')
      .html(htmlFromProps);
  
  tooltip_divs.exit().remove(); 
}

function codeToId(code){
  return `code_${code.replace('.', '_')}`;
}

