## Question to Answer

We notice that the trend of the temperature data is bi-modal. For the first peak, count of temperature values for female mice and male mice are significantly different around range 36.4 to 36.8 (where female temperature counts are a lot higher), and the second peak are located slightly different (male at 37.5 and female at 38). We want to explore the reasoning behind this difference through explorations in their daily cycle, and potentential interactions to their activity level, as well as estrus cycle in female mice. 

Features:
`Temperature`: the temperature data in Celsius for each mouse at each minute for the duration of 2 weeks.
`Activity`: the activity level for each mouse at each minute for the duration of 2 weeks.

Considerations:
estrus cycle
light-dark cycle
sex: male vs female mice

## Plot Ideas
1. Comparison graph (male vs female)
    Necessary:
    - want to emphasize estres cycle temperature/activity difference
    - normalize data to graph temp & activity on same scale
    - 1 line for average across each sex
    - user can select sample mice to display
    - label the estres cycles
    Nice to have:
    - have dynamic display (mouse icon moves across screen)

2. Histograms (interactive)
    - overlay histogram that shows distribution difference across two sexs
    - display distribution function (test how well this visualizes)

## Tasks

- 2 people work on comparison graph
    - (Jianyun) setup graph & average line, normalize data (preferably smoothed out)
    - (Jason) user interaction (select which sample to display), label estres cycle
- (Jessica) 1 person works on histogram & exploration
- (Leo) 1 person does the integration & dynamic display for comparison graph