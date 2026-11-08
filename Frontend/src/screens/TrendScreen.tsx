import React, { useState } from 'react';
import { View, Pressable } from 'react-native-web';
import { useApp } from '../context/AppContext';

import {
  Screen,
  Title,
  Segmented,
  Row,
  Txt,
  Card,
  Pill,
  IconBox,
  MealRow,
  c,
} from '../ui';

interface TrendScreenProps {
  onNavigate: (screen: string) => void;
  initialTab?: number;
}

export default function TrendScreen({
  onNavigate,
  initialTab = 0,
}: TrendScreenProps) {

  const [activeTab, setActiveTab] = useState(initialTab);
  const [timeRange, setTimeRange] =
    useState<'Week' | 'Month' | '6 Months'>('Week');

  const [selectedDay, setSelectedDay] = useState(15);

  const {
    currentWeight,
    consumedKcal,
    waterMl,
    stepsCount,
    showToast,
  } = useApp();


  const daysData = [
    { day:'M', date:9, kcal:0 },
    { day:'T', date:10, kcal:0 },
    { day:'W', date:11, kcal:0 },
    { day:'T', date:12, kcal:0 },
    { day:'F', date:13, kcal:0 },
    { day:'S', date:14, kcal:consumedKcal },
    { day:'S', date:15, kcal:0 },
  ];


  const maxKcal = Math.max(
    ...daysData.map(d => d.kcal),
    2000
  );


  const calendarDays = Array.from(
    {length:31},
    (_,i)=>i+1
  );


  return (
    <Screen
      tab="Trend"
      onSelectTab={onNavigate}
    >

      {/* HEADER */}
      <Title
        title={
          activeTab === 0
            ? "Your everyday, in focus."
            : "A look back."
        }
        sub={
          activeTab === 0
            ? "Small habits. A bigger picture."
            : "Your meals, one day at a time."
        }
        right={
          <IconBox
            label="cal"
            onPress={() =>
              setActiveTab(activeTab === 0 ? 1 : 0)
            }
          />
        }
      />


      <Segmented
        items={[
          "Analytics & Trends",
          "Meal Calendar"
        ]}
        active={activeTab}
        onSelect={setActiveTab}
      />


      {activeTab === 0 && (

        <>

          {/* TIME RANGE */}
          <Row
            style={{
              marginBottom:14,
              gap:6
            }}
          >

            {(['Week','Month','6 Months'] as const)
              .map(range => (

              <Pill
                key={range}
                active={timeRange===range}
                onPress={()=>{
                  setTimeRange(range);
                  showToast(`Viewing ${range}`);
                }}
              >
                {range}
              </Pill>

            ))}

          </Row>



          {/* CALORIE CARD */}

          <Card>

            <Row
              style={{
                justifyContent:'space-between'
              }}
            >

              <View>

                <Txt
                  s={17}
                  w="800"
                >
                  Calorie intake
                </Txt>


                <Txt
                  s={11}
                  color={c.mute}
                >
                  9–15 Oct 2026
                </Txt>

              </View>


              <Pill bg={c.yellow}>
                kcal
              </Pill>


            </Row>


            <Row
              style={{
                alignItems:'baseline',
                marginTop:12
              }}
            >

              <Txt
                s={34}
                w="800"
              >
                {consumedKcal.toLocaleString()}
              </Txt>


              <Txt
                s={12}
                color={c.mute}
                style={{
                  marginLeft:8
                }}
              >
                avg / completed day
              </Txt>

            </Row>


            {/* GRAPH AREA */}

            <View
              style={{
                height:160,
                marginTop:20,
                position:'relative'
              }}
            >

              {[0,1,2,3].map(i=>(

                <View
                  key={i}
                  style={{
                    position:'absolute',
                    left:0,
                    right:0,
                    top:i*35,
                    borderTopWidth:1,
                    borderStyle:'dotted',
                    borderColor:c.line
                  }}
                />

              ))}


              <Row
                style={{
                  height:'100%',
                  alignItems:'flex-end',
                  justifyContent:'space-between'
                }}
              >

                {daysData.map((d,index)=>{

                  const height =
                    d.kcal === 0
                    ? 8
                    : (d.kcal/maxKcal)*120;


                  return (

                    <Pressable
                      key={index}
                      onPress={()=>{
                        setSelectedDay(d.date);
                        showToast(
                          `${d.date} Oct: ${d.kcal} kcal`
                        );
                      }}
                    >

                      <View
                        style={{
                          width:26,
                          height,
                          borderRadius:14,
                          backgroundColor:
                            d.kcal===0
                            ? c.block
                            : c.yellow
                        }}
                      />

                    </Pressable>

                  )

                })}

              </Row>

            </View>


            <Row
              style={{
                justifyContent:'space-between',
                marginTop:8
              }}
            >

              {daysData.map(d=>(

                <Txt
                  key={d.date}
                  s={10}
                  color={c.mute}
                >
                  {d.day}
                </Txt>

              ))}

            </Row>


            <Row
              style={{
                justifyContent:'space-around',
                marginTop:14,
                paddingTop:10,
                borderTopWidth:1,
                borderColor:c.line
              }}
            >

              {[
                {name:'Breakfast', color:'#FFEFA0'},
                {name:'Lunch', color:'#DDF0D3'},
                {name:'Dinner', color:'#D8EDF8'},
                {name:'Snacks', color:'#FBDAD6'},
              ].map(item => (

                <Row
                  key={item.name}
                  style={{
                    alignItems:'center'
                  }}
                >

                  <View
                    style={{
                      width:8,
                      height:8,
                      borderRadius:4,
                      backgroundColor:item.color,
                      marginRight:5
                    }}
                  />

                  <Txt
                    s={10}
                    color={c.mute}
                  >
                    {item.name}
                  </Txt>

                </Row>

              ))}

            </Row>


            <Txt
              s={11}
              color={c.mute}
              style={{
                marginTop:12
              }}
            >
              Today is still in progress. Your final intake will appear after the day ends.
            </Txt>


          </Card>

                    {/* WEIGHT TREND */}

          <Card
            style={{
              marginTop:16
            }}
          >

            <Row
              style={{
                justifyContent:'space-between'
              }}
            >

              <Txt
                s={17}
                w="800"
              >
                Weight trend
              </Txt>


              <Txt
                s={10}
                color={c.mute}
              >
                kg
              </Txt>

            </Row>



            <Row
              style={{
                alignItems:'baseline',
                marginTop:10
              }}
            >

              <Txt
                s={34}
                w="800"
              >
                {currentWeight}
              </Txt>


              <Txt
                s={11}
                color={c.mute}
                style={{
                  marginLeft:8
                }}
              >
                latest · 15 Oct
              </Txt>


            </Row>



            {/* SIMPLE EMPTY GRAPH PLACEHOLDER */}

            <View
              style={{
                height:120,
                marginTop:10,
                borderRadius:16,
                backgroundColor:c.bg,
                overflow:'hidden',
                position:'relative'
              }}
            >

              {[0,1,2].map(i=>(

                <View
                  key={i}
                  style={{
                    position:'absolute',
                    left:20,
                    right:20,
                    top:30+i*25,
                    borderTopWidth:1,
                    borderStyle:'dotted',
                    borderColor:c.line
                  }}
                />

              ))}


              <Txt
                s={11}
                color={c.mute}
                style={{
                  position:'absolute',
                  top:50,
                  alignSelf:'center'
                }}
              >
                Weight history will appear after tracking starts
              </Txt>


            </View>



          </Card>



          {/* WATER + STEPS */}

          <Row
            style={{
              marginTop:16
            }}
          >

            <Card
              bg={c.blue}
              style={{
                flex:1,
                marginRight:6
              }}
            >

              <Txt
                s={26}
                w="800"
              >
                {(
                  waterMl / 1000
                ).toFixed(1)}L
              </Txt>


              <Txt
                s={11}
                color={c.mute}
              >
                Daily average water
              </Txt>

            </Card>



            <Card
              bg={c.green}
              style={{
                flex:1,
                marginLeft:6
              }}
            >

              <Txt
                s={26}
                w="800"
              >
                {stepsCount.toLocaleString()}
              </Txt>


              <Txt
                s={11}
                color={c.mute}
              >
                Daily average steps
              </Txt>

            </Card>


          </Row>


        </>

      )}



      {/* MEAL CALENDAR TAB */}

      {activeTab === 1 && (

        <>

          <Card>


            <Row
              style={{
                justifyContent:'space-between',
                marginBottom:12
              }}
            >

              <Pressable
                onPress={()=>
                  showToast("Previous month")
                }
              >

                <Txt s={18}>
                  ‹
                </Txt>

              </Pressable>



              <Txt
                s={16}
                w="800"
              >
                October 2026
              </Txt>



              <Pressable
                onPress={()=>
                  showToast("Next month")
                }
              >

                <Txt s={18}>
                  ›
                </Txt>

              </Pressable>


            </Row>



            <Row
              style={{
                justifyContent:'space-between',
                marginBottom:8
              }}
            >

              {
                [
                  'M',
                  'T',
                  'W',
                  'T',
                  'F',
                  'S',
                  'S'
                ].map((d,i)=>(

                  <Txt
                    key={i}
                    s={11}
                    color={c.mute}
                    style={{
                      width:36,
                      textAlign:'center'
                    }}
                  >
                    {d}
                  </Txt>

                ))
              }


            </Row>



            <Row
              style={{
                flexWrap:'wrap'
              }}
            >

              {
                [
                  null,
                  null,
                  null,
                  ...calendarDays
                ]
                .map((day,index)=>{


                  if(!day)
                  return (
                    <View
                      key={index}
                      style={{
                        width:'14.28%'
                      }}
                    />
                  )


                  const selected =
                    day===selectedDay;


                  return (

                    <View
                      key={index}
                      style={{
                        width:'14.28%',
                        alignItems:'center',
                        marginVertical:5
                      }}
                    >

                      <Pressable

                        onPress={()=>{
                          setSelectedDay(day)
                        }}

                        style={{

                          width:34,
                          height:34,
                          borderRadius:17,

                          backgroundColor:
                            selected
                            ? c.yellow
                            :'transparent',

                          borderWidth:
                            day<=15
                            ? 1
                            :0,

                          borderColor:c.dark,

                          alignItems:'center',
                          justifyContent:'center'

                        }}

                      >

                        <Txt
                          s={12}
                          w="700"
                        >
                          {day}
                        </Txt>


                      </Pressable>


                    </View>

                  )

                })
              }


            </Row>


          </Card>

                    {/* SELECTED DAY DETAILS */}

          <Row
            style={{
              justifyContent:'space-between',
              marginTop:22,
              alignItems:'center'
            }}
          >

            <Txt
              s={17}
              w="800"
            >
              {selectedDay} October 2026
            </Txt>


            <Txt
              s={11}
              color={c.mute}
            >
              Selected log
            </Txt>

          </Row>



          <Card
            bg={c.blue}
            style={{
              marginVertical:12
            }}
          >

            <Row
              style={{
                justifyContent:'space-between',
                alignItems:'center'
              }}
            >

              <View>

                <Txt
                  s={11}
                  color={c.mute}
                >
                  Net calories
                </Txt>


                <Row
                  style={{
                    alignItems:'baseline'
                  }}
                >

                  <Txt
                    s={32}
                    w="800"
                  >
                    {consumedKcal.toLocaleString()}
                  </Txt>


                  <Txt
                    s={13}
                    style={{
                      marginLeft:6
                    }}
                  >
                    kcal
                  </Txt>


                </Row>

              </View>


              <Pill bg={c.green}>
                ✓ Within target
              </Pill>


            </Row>



            <Txt
              s={11}
              color={c.mute}
              style={{
                marginTop:6
              }}
            >
              {consumedKcal.toLocaleString()} kcal eaten · 240 kcal burned
            </Txt>



            <Row
              style={{
                justifyContent:'space-between',
                marginTop:14,
                paddingTop:10,
                borderTopWidth:1,
                borderColor:c.line
              }}
            >

              <Txt
                s={12}
                w="700"
              >
                💧 {waterMl} ml
              </Txt>


              <Txt
                s={12}
                w="700"
              >
                👟 {stepsCount.toLocaleString()} steps
              </Txt>


            </Row>


          </Card>



          {/* MEALS */}

          <MealRow
            meta="Breakfast · 8:15 AM"
            name="Avocado & egg toast"
            kcal="380 kcal"
          />


          <MealRow
            meta="Lunch · 12:45 PM"
            name="Hainanese Chicken Rice"
            kcal="580 kcal"
          />


          <MealRow
            meta="Dinner · 7:10 PM"
            name="Salmon nourish bowl"
            kcal="720 kcal"
          />


          <MealRow
            meta="Snacks · 4:00 PM"
            name="Berry yogurt & granola"
            kcal="240 kcal"
          />


        </>

      )}


    </Screen>

  );

}