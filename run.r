library(tidyverse)


category_colors <- readr::read_csv('category_colors.csv')


data <- readr::read_csv('phewas_results.csv') %>% 
  right_join(category_colors, by = c("category" = "description")) %>% 
  select(-tooltip)
