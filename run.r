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
  # mutate(annotated = id %in% codes_to_annotate) %>%
  select(-Cases, -Controls, -OR)



data %>%
  mutate(
    p_val = p_val + runif(n(), min = 0, max = 0.2),
    p_val = ifelse(p_val > 1, 1, p_val)
  ) %>%
  manhattan(annotation_font_size = 10)
