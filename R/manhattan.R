#' Manhattan Plot
#'
#' Generate an interactive manhattan plot with the ability to add and drag annotation around and export the plot as an SVG for use in your vector editor of choice.
#'
#' The function can work entirely with a dataframe and no other arguments. There are three neccesary columns in the dataframe:
#' /code{p_val} needs to contain the P-Value from your analysis for positioning the SNP or code on the plot's y axis.
#' /code{id} is a simple character string ID that corresponds to the name of the snp or code or whatever other entity you want to plot.
#' /code{color} is a chacter vector of valid html colors (so simple color names like \code{'blue'} or hex strings like \code{'#895de6'}). This column will be used to map the colors of the points and is usually used to denote separation between chromosomes or code categories.
#' Another optional column you can include is \code{annotated}. This column is a simple \code{TRUE/FALSE} value corresponding to if you would like an annotation drawn for this code automatically on running the function.
#' Any other columns passed in the dataframe will get turned into the body of the annotations. So if you have three extra columns corresponding to
#' 'gene, chromosome, and minor allele frequency' you would get a tooltip that is headed by the value stored in the \code{id} column with each line containing the title of the extra columns followed by their value.
#' In addition, the column \code{p_val} is sent as \code{'P-Value'} to the tooltip. You can disable this P-value in the annotation by adding it to a vector passed to the argument \code{cols_to_ignore}. For instance if you
#' wanted in our previous example to just show the gene and minor allele frequency from our previous example in the annotations you would pass \code{cols_to_ignore = c('P-Value', 'chromosome')} to ommit those two properties.
#'
#' @param data Dataframe containing the data to be plotted. Needs three columns \code{id} which corresponds to the unique snp(GWAS) or phecode(PheWAS), \code{p_val} which is the p-value from your association study, and \code{color} which provides the color for the points.
#' @param title Character string containing plot title. If left as \code{NULL} no title is drawn and plot takes up a bit more vertical space.
#' @param grid_snap When dragging annotations should they snap to a grid? This helps with lining things up neatly but looses more fine-grained control over annotation position.
#' @param axes_font_size Size of the y axis text in HTML px size.
#' @param axes_title_size Size of the x and y axis titles in HTML px size.
#' @param point_size Size of the points drawn for each snp or code. Default is 4.
#' @param significance_thresh Position in terms of p-value for a threshold line. If left out no line will be drawn.
#' @param x_axis_title Title of the x-axis. Defaults to nothing.
#' @param y_max How high do we want the y axis to go? Default will go to either the most significant point or the threshold line depending on which is higher, but using this argument you can add more space for placing annotations.
#' @param download_button Show the download plot button? Default is yes but if the plot is being used for display instead of exporting for publication turning off probably makes sense.
#' @param simple_annotation By default the annotations will show the column name in bold then the column value. By enabling this argument the column name is removed and just the column values are printed.
#' @param annotation_outline Do you want an outline drawn around the annotation boxes? If set to no the boxes still have a white background but no outline.
#' @param cols_to_ignore The names of any columns in the dataset that you don't want included in the annotations. You could alternatively just remove these columns before passing to the function. To hide p-value include \code{'P-Value'} in this.
#'
#' @return An html interactive manhattan plot.
#' @export
#'
#' @examples
#'
#' manhattanPlotr::manhattan(myGWASresults, title = 'GWAS of snp rs291080')
manhattan <- function(
  data,
  title = NULL,
  grid_snap = TRUE,
  axes_font_size = 15,
  axes_title_size = 22,
  point_size = 4,
  significance_thresh = NULL, #1.6e-5,
  x_axis_title = '',
  y_max = NULL,
  download_button = TRUE,
  simple_annotation = FALSE,
  annotation_outline = TRUE,
  cols_to_ignore = c('P-Value', 'Category', 'OR', 'Cases', 'Controls')
){
  r2d3::r2d3(
    data = data,
    # script = system.file("bundled.js", package = "manhattanPlotr"),
    script = 'inst/bundled.js',
    options = list(
      title = title,
      grid_snap = grid_snap,
      axis_font_size = axes_font_size,
      axis_title_size = axes_title_size,
      point_size = point_size,
      significance_thresh = significance_thresh,
      x_axis = x_axis_title,
      y_max = y_max,
      download_button = download_button,
      simple_annotation = simple_annotation,
      annotation_outline = annotation_outline,
      cols_to_ignore = cols_to_ignore
    ),
    container = 'div',
    dependencies = 'd3-jetpack'
  )
}
