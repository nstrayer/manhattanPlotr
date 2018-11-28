// !preview r2d3 data=data, options = list(significance_thresh = 1e-3, color_key = category_colors), container = 'div', dependencies = 'd3-jetpack'
//
// r2d3: https://rstudio.github.io/r2d3
//

const svg = div.selectAppend('svg').at({width,height});
const margin = ({top: 20, right: 60, bottom: 30, left: 40});
const tooltip_offset = 15;
const {significance_thresh} = options;

const tooltip_style = {
  background:'white',
  borderRadius: '10px',
  padding: '0px 15px',
  boxShadow: '1px 1px 3px black',
  position:'fixed',
  top: d => `${d.y}px`,
  left:d => `${d.x}px`,
};

const delete_button_style = {
  borderRadius: '5px',
  display: 'none',
};


let tooltips = [];
// Holds the indices of rows that need tooltips drawn. 
//const tooltip_indices = [100];
//const tooltip_divs = svg.selectAll('.tooltip')

const log10_pval_max = d3.max(data, d => {
    // Add property to data
    d.log10_p_val = -Math.log10(d.p_val);
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


const codes = svg.selectAll('.code_bubble')
  .data(data)
  .enter().append('circle')
  .at({
    cx: (d,i) => x(i),
    cy: (d,i) => y(d.log10_p_val),
    r: 3,
    fill: (d,i) => d.color
  })
  .on('click', (d,i) => {
 
    d.y = d3.event.clientY + tooltip_offset;
    d.x = d3.event.clientX + tooltip_offset;
    
    tooltips.push(d);
    drawTooltips(tooltips);
  });
  
// Draw significance line on y-axis
significance_line = svg.selectAppend('g.significance_line')
  .translate([0,y(-Math.log10(significance_thresh))]);
  
significance_line.selectAppend('line')
  .at({
    x1: margin.left,
    x2: width - margin.right,
    stroke: 'lightgrey',
    strokeWidth: 1,
  });
  
significance_line.selectAppend('text')
  .at({
    x: width - margin.right,
    fontAlign: 'left',
    fontSize: 18
  })
  .text(d3.format(".2e")(significance_thresh));



function htmlFromProps(code){
  return Object.keys(code).reduce(
   (accum, curr, i) => accum + `<strong>${curr}:</strong> ${code[curr]} </br>`,
   ''
  );
}

function drawTooltips(tooltips){
  
  const tooltip_divs = div.selectAll('.tooltip')
    .data(tooltips);
    
  const drawn_tips = tooltip_divs.enter()
    .append('div.tooltip')
    .st(tooltip_style)
    .html(htmlFromProps)
    .on('mouseover', function(){
      d3.select(this).select('button').style('display', 'block');
      d3.select(this).select('span').style('display', 'block');
    })
    .on('mouseout', function(){
      d3.select(this).select('button').style('display', 'none');
      d3.select(this).select('span').style('display', 'none');
    });
    
   drawn_tips
    .append('button')
    .text('Remove')
    .st(delete_button_style)
    .on('click', function(current){
      const toDeleteIndex = tooltips.reduce((place, d, i) => d.code === current.code ? i : place, -1);
      tooltips.splice(toDeleteIndex, 1);
      drawTooltips(tooltips);
    });
    
   drawn_tips
    .append('span')
    .html(`<img src = 'http://chittagongit.com//images/drag-icon/drag-icon-2.jpg' width = 20px, height = 20px/>`)
    .style('display', 'none')
    .on('drag',function(d){
      const {clientX, clientY} = d3.event;
      d.x = clientX + tooltip_offset;
      d.y = clientY + tooltip_offset;
      
      d3.select(this).parent().st({  
        top: `${d.y}px`,
        left:`${d.x}px`,
      });
      //drawTooltips(tooltips);
    });
  
  tooltip_divs.exit().remove(); 
}

//debugger;
