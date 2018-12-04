library(tidyverse)


category_colors <- readr::read_csv('category_colors.csv')


codes_to_annotate = c(
  '289',
  '289.8',
  '117',
  '110.12',
  '681.7',
  '575.1',
  '420.3',
  '571.6',
  '575.8',
  '575',
  '573.5',
  '573.2'
)


data <- readr::read_csv('rs3211783_phewas.csv') %>% 
  select(
    id = jd_code, 
    Description = jd_string, 
    Cases = cases, 
    Controls = controls,
    OR = odds_ratio, 
    p_val = p, 
    Category = category_string,
  ) %>% 
  right_join(category_colors, by = c("Category" = "description")) %>% 
  mutate(
    annotated = id %in% codes_to_annotate
  ) %>% 
  select(-Cases, -Controls, -OR)


r2d3::r2d3(
  data = data, 
  script = 'index.js',
  options = list(
    grid_snap = TRUE, 
    axis_font_size = 15, 
    axis_title_size = 22, 
    point_size = 4, 
    significance_thresh = 1.6e-5, 
    x_axis = 'Phecode', 
    y_max = 5, 
    download_button = TRUE, 
    simple_annotation = FALSE,
    annotation_outline = TRUE
    # cols_to_ignore = c('P-Value', 'Category', 'OR', 'Cases', 'Controls')
  ), 
  container = 'div', 
  dependencies = 'd3-jetpack'
)

