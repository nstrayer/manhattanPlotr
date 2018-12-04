function codeToId(code){
  return `code_${code.replace('.', '_')}`;
}


function downloadPlot(svg){
  const svgData = svg.node().outerHTML;
  const svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = "manhattan_plot.svg";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function snapToGrid(x, grid_step){
  return Math.round(x / grid_step) * grid_step;
}

module.exports = {
  codeToId: codeToId,
  downloadPlot: downloadPlot,
  snapToGrid: snapToGrid
};