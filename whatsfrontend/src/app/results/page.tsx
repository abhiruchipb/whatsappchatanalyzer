"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveChord } from '@nivo/chord';
import { ResponsivePie } from '@nivo/pie';
import AIAnalysis from '@/components/AIAnalysis';

// Define an interface for the expected data structure
interface AnalysisResults {
  chat_name?: string;
  total_messages: number;
  days_since_first_message: number;
  most_active_users: { [username: string]: number };
  conversation_starters: { [username: string]: number };
  most_ignored_users: { [username: string]: number };
  first_text_champion: { user: string; percentage: number };
  longest_monologue: { user: string; count: number };
  common_words: { [word: string]: number };
  common_emojis: { [emoji: string]: number };
  daily_activity: Array<{ day: string; value: number }>;
  average_response_time_minutes: number;
  peak_hour: string;
  user_monthly_activity: Array<{
    id: string;
    data: Array<{
      x: string;
      y: number;
    }>;
  }>;
  weekday_vs_weekend_avg: {
    average_weekday_messages: number;
    average_weekend_messages: number;
    difference: number;
    percentage_difference: number;
  };
  user_interaction_matrix: (string | number | null)[][] | null;
  ai_analysis: {
    summary: string;
    people: Array<{
      name: string;
      animal: string;
      description: string;
    }>;
  };
}

// Define interface for word data
export default function ResultsPage() {
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topWords, setTopWords] = useState<{ text: string; value: number }[]>([]);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const wordContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedResults = sessionStorage.getItem('analysisResults');
      if (storedResults) {
        const parsedResults: AnalysisResults = JSON.parse(storedResults);

        if (!parsedResults.ai_analysis) {
          parsedResults.ai_analysis = {
            summary: "AI analysis not available.",
            people: []
          };
        } else if (typeof parsedResults.ai_analysis === 'string') {
          try {
            parsedResults.ai_analysis = JSON.parse(parsedResults.ai_analysis as unknown as string);
          } catch (e) {
            console.error("Failed to parse AI analysis from string:", e);
            parsedResults.ai_analysis = {
              summary: parsedResults.ai_analysis as unknown as string,
              people: []
            };
          }
        }

        if (!parsedResults.ai_analysis.people) {
          parsedResults.ai_analysis.people = [];
        }

        setResults(parsedResults);
        console.log("AI Analysis data:", parsedResults.ai_analysis);

        if (parsedResults.common_words) {
          const sortedWords = Object.entries(parsedResults.common_words)
            .map(([text, value]) => ({ text: text.toUpperCase(), value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6); // Get top 6

          setTopWords(sortedWords);
        }

      } else {
        setError('No analysis results found. Please upload a file first.');
      }
    } catch (err) {
      console.error("Failed to parse results from sessionStorage:", err);
      setError("Could not load analysis results. Data might be corrupted.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const measureContainer = () => {
      if (wordContainerRef.current) {
        setContainerWidth(wordContainerRef.current.clientWidth);
      }
    };

    measureContainer();
    window.addEventListener('resize', measureContainer);

    return () => window.removeEventListener('resize', measureContainer);
  }, [topWords]);

  // Define min/max font size constraints
  const minCharSize = 1.0;
  const absoluteMaxCharSize = 7.0;

  const getCharSize = (count: number, text: string) => {
    const baseFontSize = 16;

    if (!containerWidth || topWords.length === 0) {
      return `${minCharSize}rem`;
    }

    const topWord = topWords[0];
    const N = topWord.text.length;

    const frequencyCountWidthEstimate = 60;
    const availableWidthForWord = Math.max(10, containerWidth - frequencyCountWidthEstimate);

    let idealFontSizeRem = absoluteMaxCharSize;
    if (N > 0) {
      const estimatedFontSizePx = (availableWidthForWord - N * 8 - Math.max(0, N - 1) * 4) / N;
      idealFontSizeRem = estimatedFontSizePx / baseFontSize;
    }

    const dynamicMaxCharSize = Math.max(minCharSize, Math.min(absoluteMaxCharSize, idealFontSizeRem));

    if (text === topWord.text) {
      return `${Math.max(minCharSize, dynamicMaxCharSize).toFixed(2)}rem`;
    }
    const minCountDisplayed = topWords.length > 0 ? topWords[topWords.length - 1].value : 1;
    const effectiveMaxCount = Math.max(topWord.value, 1);
    const effectiveMinCount = Math.max(minCountDisplayed, 1);

    if (effectiveMaxCount <= effectiveMinCount || count <= effectiveMinCount) {
      return `${minCharSize}rem`;
    }

    const scale = (count - effectiveMinCount) / (effectiveMaxCount - effectiveMinCount);
    const size = minCharSize + (dynamicMaxCharSize - minCharSize) * scale;

    const clampedSize = Math.max(minCharSize, Math.min(dynamicMaxCharSize, size));

    return `${clampedSize.toFixed(2)}rem`;
  };

  // Define the list of background colors
  const bgColors = [
    'bg-rose-100',
    'bg-green-100',
    'bg-pink-100',
    'bg-purple-100',
    'bg-sky-100',
    'bg-violet-100',
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="text-lg text-red-600">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600">No results data available.</p>
      </div>
    );
  }

  // Prepare data for User Interaction Chord Diagram
  const chordKeys = results.user_interaction_matrix && results.user_interaction_matrix.length > 1
    ? results.user_interaction_matrix[0]?.slice(1).map(String) ?? []
    : [];

  const chordMatrix = results.user_interaction_matrix && results.user_interaction_matrix.length > 1
    ? results.user_interaction_matrix.slice(1).map(row => row.slice(1).map(value => (typeof value === 'number' ? value : 0)))
    : [];

  // Prepare data for Common Emojis visualization
  const sortedEmojis = Object.entries(results.common_emojis)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <main className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-between mb-2">
        <Image
          src="bloop_logo.svg"
          alt="Bloop Logo"
          width={300}
          height={50}
          className='mb-2'
        />
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          {results.chat_name ? `Analysis with ${results.chat_name}` : "Analysis Results"}
        </h1>
      </div>
      <div className="space-y-8">
        {/* Overall Chat Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-purple-100 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] flex items-center">
            <Image src="/icons/chat.svg" alt="Total Messages" width={40} height={20} className="mr-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">Total Messages</h2>
              <p className="text-2xl font-bold text-violet-800">{results.total_messages.toLocaleString()}</p>
            </div>
          </section>

          {/* Days Since First Message */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-emerald-100 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] flex items-center">
            <Image src="/icons/calendar.svg" alt="Days Since First Message" width={48} height={48} className="mr-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">Days Since First Message</h2>
              <p className="text-2xl font-bold text-emerald-700">{results.days_since_first_message} {results.days_since_first_message === 1 ? 'day' : 'days'}</p>
            </div>
          </section>

          {/* Most Ignored Users */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-sky-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] flex items-center">
            <Image src="/icons/frown.svg" alt="Most Ignored Users" width={48} height={48} className="mr-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">who gets ignored the most?</h2>
              <ul>
                {Object.entries(results.most_ignored_users)
                  .sort(([, percentageA], [, percentageB]) => percentageB - percentageA)
                  .slice(0, 1)
                  .map(([user]) => (
                    <li key={user} className="text-2xl font-bold text-sky-700">
                      {user}
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          {/* Peak Hour */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-sky-100 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] flex items-center">
            <Image src="/icons/peak.svg" alt="Longest Monologue" width={25} height={48} className="mr-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">Peak Hour</h2>
              <p className="text-2xl font-bold">{results.peak_hour}</p>
            </div>
          </section>

          {/* First Text Champion */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-violet-100 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] flex items-center">
            <Image src="/icons/trophy.svg" alt="First Text Champion" width={48} height={48} className="mr-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">who texts first usually?</h2>
              <p className="text-2xl font-bold">
                {results.first_text_champion.user}: {results.first_text_champion.percentage.toFixed(2)}%
              </p>
            </div>
          </section>

          {/* Average Response Time */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-red-100 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] flex items-center">
            <Image src="/icons/time.svg" alt="Average Response Time" width={40} height={48} className="mr-4" />
            <div>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">Average Response Time</h2>
              <p className="text-2xl text-orange-700 font-bold">~ {results.average_response_time_minutes.toFixed(2)} minutes</p>
            </div>
          </section>
        </div>

        {/* Most Active Users and Conversation Starters in a Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Most Active Users</h2>
              <Image
                src="/icons/users.svg"
                alt="Most Active Users"
                width={50}
                height={50}
                className="mr-3"
              />
            </div>
            <div style={{ height: '300px' }}>
              <ResponsivePie
                data={Object.entries(results.most_active_users).map(([user, percentage]) => ({
                  id: user,
                  label: user,
                  value: percentage,
                }))}
                margin={{ top: 40, bottom: 40 }}
                innerRadius={0.1}
                padAngle={0}
                cornerRadius={5}
                activeOuterRadiusOffset={10}
                borderWidth={1}
                colors={{ scheme: 'pastel1' }}
                enableArcLabels={true}
                arcLabel={e => `${e.id}`}
                enableArcLinkLabels={false}
              />
            </div>
          </section>

          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Conversation Starters</h2>
              <Image
                src="/icons/user.svg"
                alt="Conversation Starters"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div style={{ height: '300px' }}>
              <ResponsivePie
                data={Object.entries(results.conversation_starters).map(([user, percentage]) => ({
                  id: user,
                  label: user,
                  value: percentage,
                }))}
                margin={{ top: 40, bottom: 40 }}
                innerRadius={0.1}
                padAngle={0.7}
                cornerRadius={3}
                activeOuterRadiusOffset={8}
                borderWidth={1}
                borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                colors={{ scheme: 'pastel2' }}
                enableArcLabels={true}
                arcLabel={e => `${e.id}`}
                enableArcLinkLabels={false}
              />
            </div>
          </section>
        </div>

        {/* Common Words and Emojis in a Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Common Words */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-bold mb-4 text-gray-700">Top {topWords.length} Common Words</h2>
              <Image
                src="/icons/words.svg"
                alt="Common Words"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div ref={wordContainerRef} className='w-full flex flex-col items-start space-y-3 py-4'>
              {topWords.length > 0 ? (
                topWords.map(({ text, value }, wordIndex) => {
                  const bgColor = bgColors[wordIndex % bgColors.length];
                  // Call getCharSize with text and value
                  const charSizeStyle = getCharSize(value, text);

                  return (
                    <div key={text} className="flex items-baseline space-x-1" title={`${text}: ${value} uses`}>

                      <div className="flex space-x-1">
                        {text.split('').map((char, index) => {
                          return (
                            <span
                              key={`${text}-${index}`}
                              className={`flex items-center justify-center rounded font-bold text-gray-800 ${bgColor}`}
                              style={{
                                fontSize: charSizeStyle,
                                width: `calc(${charSizeStyle} + 0.5rem)`,
                                height: `calc(${charSizeStyle} + 0.5rem)`,
                                lineHeight: '1'
                              }}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>
                      <span className="ml-2 text-xs text-gray-500 font-medium">
                        x {value}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No common words data available.</p>
              )}
            </div>
          </section>

          {/* Common Emojis */}
          <section className="p-4 lg:h-full md:h-fit  border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Common Emojis</h2>
              <Image
                src="/icons/lovely_face.svg"
                alt="Common Emojis"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div className="flex items-center justify-center h-9/10">
              {sortedEmojis.length > 0 ? (
                <div className="grid grid-cols-3 grid-rows-2 gap-3 h-full w-full items-center justify-center my-16">
                  {sortedEmojis.slice(0, 6).map(({ emoji, count }) => (
                    <span
                      key={emoji}
                      className="flex items-center justify-center text-6xl md:text-8xl"
                      title={`${emoji}: ${count}`}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No common emojis data available.</p>
              )}
            </div>
          </section>
        </div>

        {/* AI Summary and Weekday vs Weekend Activity side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* AI Summary */}
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Chat Summary</h2>
              <Image
                src="/icons/sparkle.svg"
                alt="AI Analysis"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <AIAnalysis
              summary={results.ai_analysis?.summary || ''}
              people={results.ai_analysis?.people || []}
              summaryOnly={true}
            />
          </section>

          {/* weekend vs weekday pie chart */}
          {Object.keys(results.most_active_users).length <= 2 && (
            <section className="p-4 border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
              <div className='flex items-center justify-between mb-4'>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Weekday vs Weekend Activity</h2>
                <Image
                  src="/icons/tag.svg"
                  alt="Weekday vs Weekend Activity"
                  width={30}
                  height={30}
                  className="mr-3"
                />
              </div>
              <div className="h-64">
                <ResponsivePie
                  data={[
                    { id: 'Weekday', label: 'Weekday', value: results.weekday_vs_weekend_avg.average_weekday_messages },
                    { id: 'Weekend', label: 'Weekend', value: results.weekday_vs_weekend_avg.average_weekend_messages },
                  ]}
                  margin={{ top: 10, bottom: 10 }}
                  innerRadius={0.1}
                  padAngle={0.7}
                  cornerRadius={0}
                  enableArcLinkLabels={false}
                  enableArcLabels={true}
                  arcLabel={e => `${e.id}`}
                  activeOuterRadiusOffset={0}
                  borderWidth={1}
                  colors={{ scheme: 'pastel1' }}
                />
              </div>
            </section>
          )}
          {/* User Interaction Matrix (Chord Diagram) */}
          {results.user_interaction_matrix && chordKeys.length > 2 && chordMatrix.length > 2 && (
            <section className="p-4 border-2 border-neutral-800 rounded-lg bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
              <div className='flex items-center justify-between mb-4'>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">User Interactions Chord Diagram</h2>
                <Image
                  src="/icons/tag.svg"
                  alt="Weekday vs Weekend Activity"
                  width={30}
                  height={30}
                  className="mr-3"
                />
              </div>
              <div className="h-96 w-full">
                <ResponsiveChord
                  data={chordMatrix}
                  keys={chordKeys}
                  margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                  valueFormat=".0f"
                  padAngle={0.05}
                  innerRadiusRatio={0.96}
                  innerRadiusOffset={0}
                  enableLabel={true}
                  label="id"
                  labelOffset={15}
                  labelRotation={0}
                  colors={{ scheme: 'dark2' }}
                  isInteractive={true}
                  animate={true}
                  motionConfig="gentle"
                />
              </div>
            </section>
          )}
        </div>

        {/* AI Analysis - Personality Profiles*/}
        <div className="bg-white p-6 rounded-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)] border-2 border-neutral-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Personality Profiles</h2>
            <Image
              src="/icons/sparkle.svg"
              alt="AI Analysis"
              width={30}
              height={30}
              className="mr-3"
            />
          </div>
          <AIAnalysis
            summary={results.ai_analysis?.summary || ''}
            people={results.ai_analysis?.people || []}
            profilesOnly={true}
          />
        </div>


        {/* User Monthly Activity using Nivo Line */}
        {results.user_monthly_activity && results.user_monthly_activity.length > 0 && (
          <section className="p-4 border-2 border-neutral-800 rounded-lg bg-sky-50 shadow-[5px_5px_0px_0px_rgba(0,0,0,0.85)]">
            <div className='flex items-center justify-between'>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">User Monthly Activity</h2>
              <Image
                src="/icons/graph_def.svg"
                alt="User Monthly Activity"
                width={30}
                height={30}
                className="mr-3"
              />
            </div>
            <div className="h-96 w-full">
              <ResponsiveLine
                data={[{
                  id: 'All Users',
                  data: results.user_monthly_activity.reduce((acc, user) => {
                    user.data.forEach(item => {
                      const existing = acc.find(a => a.x === item.x);
                      if (existing) {
                        existing.y += item.y;
                      } else {
                        acc.push({ ...item });
                      }
                    });
                    return acc;
                  }, [] as { x: string; y: number }[])
                }]}
                margin={{ top: 20, right: 20, bottom: 70, left: 70 }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  format: (value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      year: '2-digit'
                    });
                  },
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: typeof window !== 'undefined' && window.innerWidth < 768 ? -90 : -45
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5, // Increased padding here
                  tickRotation: 0,
                  legend: 'Messages',
                  legendOffset: -90, // Adjust legend offset if needed
                  legendPosition: 'middle',
                  tickValues: undefined,
                  format: value => value.toLocaleString(),
                }}
                colors={{ scheme: 'pastel1' }}
                enablePoints={false}
                enableGridX={false}
                enableGridY={true}
                lineWidth={7}
                useMesh={true}
                curve="cardinal"
                legends={[]}
                theme={{
                  axis: {
                    ticks: {
                      text: {
                        fontSize: 14,
                        fill: '#333',
                        fontWeight: '600'
                      }
                    },
                    legend: {
                      text: {
                        fontSize: 16,
                        fill: '#666',
                      }
                    }
                  }
                }}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}