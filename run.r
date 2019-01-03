library(tidyverse)
library(here)
library(manhattanPlotr)

# category_colors <- readr::read_csv(here('demos/phewas_data/phewas_category_colors.csv'))

codes_to_annotate <- c(
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


data <- readr::read_csv(here('demos/phewas_data/rs3211783.csv')) %>%
  select(
    id = jd_code,
    Description = jd_string,
    Cases = cases,
    Controls = controls,
    OR = odds_ratio,
    p_val = p,
    Category = category_string
  ) %>%
  buildColorPalette(Category) %>% 
  # mutate(annotated = id %in% codes_to_annotate) %>%
  select(-Cases, -Controls, -OR)



data %>%
  # mutate(
  #   p_val = p_val + runif(n(), min = 0, max = 0.2),
  #   p_val = ifelse(p_val > 1, 1, p_val)
  # ) %>%
  manhattan(annotation_font_size = 10)
