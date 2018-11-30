// !preview r2d3 data=data, options = list(significance_thresh = 1.6e-5, color_key = category_colors, x_axis = 'Phecode', y_max = 5), container = 'div', dependencies = 'd3-jetpack'
//
// r2d3: https://rstudio.github.io/r2d3
//


const svg = div.selectAppend('svg').at({width,height});
// These aren't shown in the tooltip. 
const ommitted_props = ['x', 'y', 'log10_p_val', 'color', 'index', 'p_val', 'annotated', 'initialized'];
const margin = ({top: 20, right: 60, bottom: 30, left: 100});
const tooltip_offset = 5;
const point_size = 5;
const {significance_thresh} = options;

// annotation settings
const id_font_size = 20;
const annotation_pad = 10;
const line_height = 20;
const background_size = {width: 250, height: 150};
const delete_button_radius = 13;

// Relative drag variables
let code_start = {};
let drag_start = {};


const pval_formatter = d3.format(".2e");

const styles = {
  annotation: {
    ...background_size,
    fill: 'white',
    rx: 10,
  }
};

const tooltip_style = {
  background:'rgba(255,255,255,0.9)',
  borderRadius: '10px',
  padding: '0px 5px 6px',
  boxShadow: '1px 1px 3px black',
  position:'fixed',
  fontSize: '15px',
  width: '250px',
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
  marginRight: '-2px',
  backgroundColor: 'indianred',
  textAlign : 'center',
  width: '30px',
  color: 'white',
};

const code_span_style = `font-weight:bold; font-size:20px; color:#3e3ef1`;
const hr_style = `height: 0;margin-top: 0em;margin-bottom: .1em;border: 0;border-top: 1px solid #bcbbbb;`;

// Small popup tooltip
const popup = div.selectAppend('div.popup').st(popup_style);

//let starting_annotations = [];
let tooltips = [];

const log10_pval_max = d3.max(data, (d,i) => {
    // Add properties to data
    d.log10_p_val = -Math.log10(d.p_val);
    d['P-Value'] = pval_formatter(d.p_val);
    d.index = i;
    
    // Check if given code is annotated or not first. 
    if(d.annotated){
      tooltips.push(d);
    }
    
    // Return property to max function
    return d.log10_p_val;
  });

const log10_threshold = -Math.log10(significance_thresh);

const y_max = options.y_max || Math.max(log10_threshold, log10_pval_max);

const y = d3.scaleLinear().domain([0,y_max]).nice();
const x = d3.scaleLinear().domain([0, data.length]);


// Kick of the visualization
drawPlot(width, height);
r2d3.onResize(drawPlot);

function drawPlot(width, height){
  
  svg.at({width,height});
  
  y.range([height - margin.bottom, margin.top]);
  x.range([margin.left, width - margin.right]);

  svg.selectAppend("g.y_axis")
    .call(function(g){
      g.attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).tickSizeOuter(0));
    });
    
  // scan through and assign bookkeeping props to the tooltips. 
  tooltips.forEach(d => {
    if(!d.initialized){
      d.x = x.invert(x(d.index) + tooltip_offset);
      d.y = y.invert(y(d.log10_p_val) + tooltip_offset); 
      d.initialized = true;
    } 
  });
  
  const codes = svg.selectAppend('g.code_bubbles')
    .selectAll('.code_bubble')
    .data(data, d => d.id);
    
  codes.enter()
    .append('circle.code_bubble')
    .merge(codes)
    .at({
      cx: d => x(d.index),
      cy: d => y(d.log10_p_val),
      fill: d => d.color,
      r: point_size,
    })
    .on('click', addTooltip(false))
    .on('mouseover', function(d){
      popup
       .st({
         left: d3.event.clientX + tooltip_offset*2,
         top: d3.event.clientY + tooltip_offset,
         display: 'block'
       })
       .html(`<strong>${d.id}</strong>`);
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
  
  // axis labels
  svg.selectAppend("text.y_axis_label")
    .style('text-anchor', 'left')
    .at({
      x: 0,
      y: height/2 - 50,
      fontSize: 18
    })
    .html("-Log<tspan baseline-shift='sub' font-size=12>10</tspan>(P)");
  
  svg.selectAppend("text.x_axis_label")
    .style('text-anchor', 'middle')
    .at({
      x: width/2,
      y: height,
      fontSize: 18,
      textAnchor: 'middle'
    })
    .text(options.x_axis);
   
   drawTooltips(tooltips);

   function addTooltip(pin){
     return function(d){
       d.y = y.invert(d3.event.clientY + tooltip_offset);
       d.x = x.invert(d3.event.clientX + tooltip_offset);
     
       // check if we already have an active tooltip for the selected code. 
       if(!tooltips.find(code => code.id == d.id)){
         tooltips.push(d);
         drawTooltips(tooltips);  
       }
     };
  }
  
  function drawTooltips(tooltips){
    
    const tooltip_g = svg.append('g.tooltip_container')
      .selectAll('g.tooltip')
      .data(tooltips, d => d.id);
    
    // draw new tooltips and move the old ones to the correct positions
    const tooltip_containers = tooltip_g.enter()
      .append('g.tooltip')
      .merge(tooltip_g)
      .translate(d => [x(d.x), y(d.y)])
      .on('mouseover', function(){
        d3.select(this).selectAll('.delete_button').style('opacity', 1);
      })
      .on('mouseout', function(){
        d3.select(this).selectAll('.delete_button').style('opacity', 0);
      })
      .call(
        d3.drag()
          .on('start', function(d){
            // record initial conditions of drag for later calculating movement.
            drag_start = d3.event;
            code_start = {x:x(d.x), y:y(d.y)};
          })
          .on('drag', function(d){
            const drag_change = {
              x: d3.event.x - drag_start.x,
              y: d3.event.y - drag_start.y,
            };
            
            const x_loc = code_start.x + drag_change.x;
            const y_loc = code_start.y + drag_change.y;
          
            d.x = x.invert(x_loc);
            d.y = y.invert(y_loc);
            
            d3.select(this).translate(d => [x_loc,y_loc]);

            svg.select(`#${codeToId(d.id)}`).at({  
              x2: x_loc,
              y2: y_loc,
            });
          })
        );
    
    // remove any deleted tooltips
    tooltip_g.exit().remove();
    
    // Draw a basic rectangle box for each tooltip to write on. 
    tooltip_containers.selectAppend('rect')
      .at(styles.annotation);
    
    // Add contents of annotation as text
    tooltip_containers.selectAppend('text')
      .attr('alignment-baseline', 'hanging')
      .html(textFromProps);
      
    // Add delete button that will appear on mouseover
    tooltip_containers.selectAppend('circle.delete_button')
      .at({
        cx: styles.annotation.width - delete_button_radius,
        cy: delete_button_radius,
        r: delete_button_radius, 
        fill: 'orangered'
      })
      .style('opacity', 0)
      .on('click',function(current){
          const toDeleteIndex = tooltips.reduce((place, d, i) => d.id === current.id ? i : place, -1);
          tooltips.splice(toDeleteIndex, 1);
          svg.select(`#${codeToId(current.id)}`).remove(); // deletes the line.
          drawTooltips(tooltips);      
      })
    
    tooltip_containers.selectAppend('text.delete_button')
      .at({
        x: styles.annotation.width - delete_button_radius,
        y: delete_button_radius,
        alignmentBaseline: 'middle',
        textAnchor: 'middle',
        fill: 'white'
      })
      .text('X')
      .st({
        opacity: 0,
        pointerEvents:'none',
      })
    
    const tooltip_lines = svg.selectAll('.tooltip_line')
      .data(tooltips, d => d.id);
      
    tooltip_lines.enter().append('line.tooltip_line')
      .merge(tooltip_lines)
      .at({
        x1: d => x(d.index),
        y1: d => y(d.log10_p_val),
        x2: d => x(d.x),
        y2: d => y(d.y),
        id: d => codeToId(d.id),
        stroke: 'black',
        strokeWidth: '1px',
      })
      .classed('tooltip_line', true);
    
    tooltip_lines.exit().remove();
      
    
  }

}


function htmlFromProps(code){
  return Object.keys(code)
    .filter(prop => !ommitted_props.includes(prop))
    .reduce(
      (accum, curr, i) => curr == 'id' ? `<span style='${code_span_style}'>${code[curr]}</span></br><hr style = '${hr_style}'>` : accum + `<strong>${curr}:</strong> ${curr === 'p_val' ? pval_formatter(code[curr]) : code[curr]} </br>`,
      ''
    );
}

function textFromProps(code){
  return Object.keys(code)
    .filter(prop => !ommitted_props.includes(prop))
    .reduce(
      (accum, prop, i) => {
        const value = prop === 'p_val' ?  pval_formatter(code[prop]): code[prop];
        
        const line_body = prop === 'id' ? 
                            `<tspan font-weight='bold' font-size='${id_font_size}px'>${value}</tspan>`:
                            `<tspan font-weight='bold'>${prop}:</tspan> ${value}`;
                            
        const new_line = `<tspan x=${annotation_pad} dy=${line_height}>${line_body}</tspan>`;
        return accum + new_line;
    }, '');
}



function codeToId(code){
  return `code_${code.replace('.', '_')}`;
}

