const {
  codeToId,
  downloadPlot,
  snapToGrid,
  moveToBack,
  pval_formatter,
  generateExportArray
} = require('./helpers.js');


d3.selection.prototype.moveToBack = moveToBack;

const svg = div.selectAppend('svg').at({width,height});

// These aren't shown in the tooltip.
const ommitted_props = [...(options.cols_to_ignore || []), 'x', 'y', 'log10_p_val', 'color', 'index', 'p_val', 'annotated', 'initialized', (options.simple_annotation ? 'id': '')];
const margin = ({
  top: options.title ? 50: 20,
  right: 60,
  bottom: 30,
  left: 100
});
const tooltip_offset = 5;
const point_size = options.point_size || 5;

// annotation settings
const id_font_size = options.annotation_font_size*1.3 || 20;
const annotation_pad = 10;
const line_height = id_font_size;
const background_size = {width: 250, height: 150};
const delete_button_radius = 13;
const delete_button_pad = 3;

// Relative drag variables
let code_start = {};
let drag_start = {};


const styles = {
  annotation_rect: {
    stroke: 'lightgrey',
    strokeWidth: options.annotation_outline ? '1px' : 0,
    fill: 'white',
    rx: '15',
    cursor: 'move',
  },
  annotation_text: {
    pointerEvents: 'none',
    fontSize: options.annotation_font_size || 20,
  },
  code_popup: {
    background:'rgba(255,255,255,0.7)',
    position:'fixed',
    textAlign: 'center',
    fontSize: 18,
  },
  sig_line: {
    stroke: 'black',
    opacity: 0.5,
    strokeWidth: 1,
    x1: margin.left,
  },
  sig_line_text: {
    fontAlign: 'left',
    fontSize: 18,
  },
  axis_label: {
    fontAlign: 'middle',
    fontSize: options.axis_title_size || 18,
    fill: 'rgb(88, 110, 117)'
  },
  axis_ticks: {
    fill: 'rgb(88, 110, 117)',
    fontSize: options.axis_font_size || '20px',
  },
  tooltip_lines: {
    stroke: 'black',
    strokeWidth: '1px',
  },
  delete_button: {
    cx: - delete_button_radius,
    cy: delete_button_radius,
    r: delete_button_radius,
    fill: 'orangered'
  },
  delete_button_x: {
    x: -delete_button_radius,
    y: delete_button_radius,
    alignmentBaseline: 'middle',
    textAnchor: 'middle',
    fill: 'white',
    opacity: 0,
    pointerEvents:'none',
  },
  export_buttons: {
    position: 'fixed',
    bottom: 0,
    margin: 5,
  },
  title: {
    y: 40,
    textAnchor: 'middle',
    fontSize: 26,
  }
};


// Small popup tooltip
const popup = div.selectAppend('div.popup').st(styles.code_popup);

//let starting_annotations = [];
let tooltips = [];

if(options.download_button){
  div.selectAppend('button.download_plot')
    .text('Download Plot')
    .st({...styles.export_buttons, left: 0})
    .on('click', function(){downloadPlot(svg)});
}

if(options.export_annotations){
  div.selectAppend('button.show_annotation_positions')
    .text('Export Annotation Positions')
    .st({...styles.export_buttons, left: 150})
    .on('click', function(){generateExportArray(tooltips)});
}

const log10_pval_max = d3.max(data, (d,i) => {
  // Add properties to data
  d.log10_p_val = -Math.log10(d.p_val);
  d['P-Value'] = pval_formatter(d.p_val);
  d.index = i;

  // Check if given code is annotated or not first
  if(d.annotated) tooltips.push(d);

  // Return property to max function
  return d.log10_p_val;
});

const log10_threshold = options.significance_thresh ? -Math.log10(options.significance_thresh): 0;
const y_max = options.y_max || Math.max(log10_threshold, log10_pval_max);

// Setup x and y scales
const y = d3.scaleLinear().domain([0,y_max]).nice();
const x = d3.scaleLinear().domain([0, data.length]);


// Kick off the visualization
drawPlot(width, height);
// Setup resize behavior
r2d3.onResize(drawPlot);

function drawPlot(width, height){
  // Resize svg
  svg.at({width,height});

  // Update the ranges of our scales
  y.range([height - margin.bottom, margin.top]);
  x.range([margin.left, width - margin.right]);

  // Draw the y axis
  svg.selectAppend("g.y_axis")
    .call(function(g){
      g.attr("transform", `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).tickSizeOuter(0));
    })
    .selectAll('text')
    .st(styles.axis_ticks);

  // scan through and assign bookkeeping props to the tooltips.
  tooltips.forEach(d => {
    if(!d.initialized){
      d.x = x.invert(x(d.index) + tooltip_offset);
      d.y = y.invert(y(d.log10_p_val) + tooltip_offset);
      d.initialized = true;
    }
  });

  // Setup the actual plot points
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
         left: x(d.index) + tooltip_offset*2,
         top:  y(d.log10_p_val) - tooltip_offset*2,
         display: 'block'
       })
       .html(`<strong>${d.id}</strong>`);
    })
    .on('mouseout', function(d){
      popup.style('display', 'none');
    });

  if(options.significance_thresh){
    // Draw significance line on y-axis
    significance_line = svg.selectAppend('g.significance_line')
      .translate([0,y(-Math.log10(options.significance_thresh))]);

    significance_line.selectAppend('line')
      .at({x2: width - margin.right,...styles.sig_line});

    significance_line.selectAppend('text')
      .at({x: width - margin.right,...styles.sig_line_text})
      .text(pval_formatter(options.significance_thresh));
  }


  // axis labels
  svg.selectAppend("text.y_axis_label")
    .style('text-anchor', 'left')
    .at({...styles.axis_label,y: height/2 - 50})
    .html("-Log<tspan baseline-shift='sub' font-size=12>10</tspan>(P)");

  svg.selectAppend("text.x_axis_label")
    .style('text-anchor', 'middle')
    .at({
      ...styles.axis_label,
      x: width/2,
      y: height,
    })
    .text(options.x_axis);

  // Has the user provided a title?
  if(options.title){
    svg.selectAppend('text.title')
      .at(styles.title)
      .attr('x', width/2)
      .text(options.title);
  }

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

    const tooltip_g = svg.selectAppend('g.tooltip_container')
      .selectAll('g.tooltip')
      .data(tooltips, d => d.id);

    // Logic for determining where to start an annotation tooltip line.
    const line_start_atts = {
      x2: d => x(d.x) + tooltip_containers.select(`rect.${codeToId(d.id)}`).attr('width')/2,
      y2: d => y(d.y) + tooltip_containers.select(`rect.${codeToId(d.id)}`).attr('height')/2
    }

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

            const x_loc = snapToGrid(code_start.x + drag_change.x, options.grid_snap?5:1);
            const y_loc = snapToGrid(code_start.y + drag_change.y, options.grid_snap?5:1);

            d.x = x.invert(x_loc);
            d.y = y.invert(y_loc);

            d3.select(this).translate(d => [x_loc,y_loc]);

            svg.select(`#${codeToId(d.id)}`).at(line_start_atts);
          })
        );

    // remove any deleted tooltips
    tooltip_g.exit()
      .remove();

    // Draw a basic rectangle box for each tooltip to write on.
    tooltip_containers.selectAppend('rect')
      .at(background_size)
      .st(styles.annotation_rect)
      .attr('class', d => codeToId(d.id));

    // Add contents of annotation as text
    tooltip_containers.selectAppend('text')
      .attr('alignment-baseline', 'hanging')
      .st(styles.annotation_text)
      .html(textFromProps)
      .each(function(text_block) {
         const text_size = this.getBBox();

         d3.select(this).parent().select('rect')
          .at({
            width: text_size.width + annotation_pad*2,
            height: text_size.height + annotation_pad,
          });
      });


    // Add delete button that will appear on mouseover
    const delete_button = tooltip_containers.selectAppend('g.delete_button')
      .translate(function(d){
        const parent_rect = d3.select(this).parent().select('rect');
        return [parent_rect.attr('width') - delete_button_pad, delete_button_pad];
      });

    delete_button.selectAppend('circle.delete_button')
      .at(styles.delete_button)
      .style('opacity', 0)
      .on('click',function(current){
          const toDeleteIndex = tooltips.reduce((place, d, i) => d.id === current.id ? i : place, -1);
          tooltips.splice(toDeleteIndex, 1);

          svg.select(`#${codeToId(current.id)}`).remove(); // delete line.
          drawTooltips(tooltips);
      });

    delete_button.selectAppend('text.delete_button')
      .at(styles.delete_button_x)
      .text('X');


    const tooltip_lines = svg.selectAppend('g.tooltip_lines')
      .selectAll('.tooltip_line')
      .data(tooltips, d => d.id);

    tooltip_lines.enter().append('line.tooltip_line')
      .merge(tooltip_lines)
      .at({
        x1: d => x(d.index),
        y1: d => y(d.log10_p_val),
        id: d => codeToId(d.id),
        ...line_start_atts,
        ...styles.tooltip_lines,
      })
      .classed('tooltip_line', true);

    tooltip_lines.exit().remove();

    // Move the lines to the back so the points cover them.
    svg.select('g.tooltip_lines').moveToBack();
  }
}


function textFromProps(code){
  return Object.keys(code)
    .filter(prop => !ommitted_props.includes(prop))
    .reduce(
      (accum, prop, i) => {
        const value = prop === 'p_val' ?  pval_formatter(code[prop]): code[prop];

        const line_body = options.simple_annotation ?
                            value:
                            (prop === 'id' ?
                              `<tspan font-weight='bold' font-size='${id_font_size}px'>${value}</tspan>`:
                              `<tspan font-weight='bold'>${prop}:</tspan> ${value}`);

        const new_line = `<tspan x=${annotation_pad} dy=${line_height} font-size='${styles.annotation_text.fontSize}px'>${line_body}</tspan>`;
        return accum + new_line;
    }, '');
}
