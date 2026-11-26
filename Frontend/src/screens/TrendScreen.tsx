import React, { useState, useEffect } from 'react';
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

  // Follow the tab chosen from outside (e.g. "Trend · Calendar" in the top bar).
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const now = new Date();
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const {
    currentWeight,
    targetWeight,
    weightLogs,
    logWeight,
    consumedKcal,
    waterMl,
    stepsCount,
    showToast,
  } = useApp();

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

          {/* CALORIE INTAKE CHART (Member 5) */}
          <CalorieIntakeChart />

                    {/* WEIGHT TREND GRAPH */}
          <WeightTrendCard
            currentWeight={currentWeight}
            targetWeight={targetWeight}
            weightLogs={weightLogs}
            onLogWeight={logWeight}
          />



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