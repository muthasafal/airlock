#!/usr/bin/env node
// Generates the stand-in pools in src/pools/*.json (BRIEF §8.2).
// All names are common given names / surnames; companies are invented
// compounds checked against a list of famous brands. Run: node scripts/gen-pools.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'pools');
const words = (s) => [...new Set(s.split(/\s+/).filter(Boolean))];

const indianFemale = words(`
Aanya Aditi Aishwarya Akanksha Amrita Ananya Anjali Ankita Anushka Aparna Archana Arpita Asha Avni
Bhavna Bhumi Chaitali Charu Damini Deepa Deepika Devika Diya Divya Ekta Esha Gauri Gayatri Geeta
Harini Heena Indira Ira Isha Ishita Jaya Jhanvi Juhi Kajal Kalpana Kamala Kavya Keya Kiran Komal
Kriti Lakshmi Lata Leela Madhu Mahima Malini Manisha Maya Meena Meera Megha Mitali Mohini Mridula
Namita Nandini Naina Neha Nidhi Nikita Nisha Nithya Padma Pallavi Pooja Prachi Pragya Pranali
Preeti Prerna Priya Priyanka Radha Radhika Rashmi Rekha Renu Revati Riddhi Ritu Rohini Ruchi
Rupali Sakshi Saloni Sanjana Sapna Sarita Shalini Shanti Sharmila Shilpa Shreya Shruti Simran
Sneha Sonal Sonia Suhani Sujata Sunita Supriya Swati Tanvi Tara Trisha Uma Urmila Vaishali Vandana
Varsha Vidya Vrinda Yamini Zoya Anisha Bhavya Charvi Gunjan Hema Ishani Jyoti Kashvi Lavanya
Mansi Navya Ojasvi Parul Rhea Saanvi Tanya Usha Vani Yashika Ragini Shobha Tejal Aarohi Kiara
Amala Bindu Chhaya Dhara Garima Hansa Indu Jayashree Kumud Leena Manjari
`);
const indianMale = words(`
Aarav Abhay Abhishek Aditya Ajay Akash Akhil Alok Aman Amit Anand Anil Ankit Anuj Arjun Arnav Arun
Ashok Ashwin Atul Ayaan Balaji Bharat Chetan Chirag Darshan Deepak Dev Dhruv Dinesh Gaurav Girish
Gopal Harish Harsh Hemant Hitesh Ishaan Jatin Jay Kabir Kailash Karan Kartik Kishore Krishna Kunal
Lalit Lokesh Madhav Mahesh Manish Manoj Mayank Mihir Mohan Mukesh Naveen Neeraj Nikhil Nilesh Nitin
Omkar Pankaj Paras Parth Pavan Pradeep Prakash Pranav Prasad Prateek Pratik Puneet Rahul Raj Rajat
Rajesh Rakesh Ram Ramesh Ravi Rishi Ritesh Rohan Rohit Sachin Sahil Sameer Sandeep Sanjay Santosh
Saurabh Shankar Shashank Shiv Shreyas Siddharth Sohan Sudhir Sumit Sunil Suraj Suresh Tarun Tejas
Tushar Uday Umesh Varun Vedant Vijay Vikas Vikram Vinay Vinod Vishal Vivek Yash Yogesh Aakash
Anirudh Bhavesh Chandan Devansh Eshan Farhan Gautam Hrithik Imran Jagdish Kavin Lakshay Manav
Naman Ojas Pritam Raghav Sarthak Tanmay Utkarsh Vihaan Yuvraj Zubin Advait Hari Keshav Samar Tilak
`);
const indianSurnames = words(`
Agarwal Ahluwalia Ahuja Arora Bajaj Bakshi Banerjee Bansal Basu Bhalla Bhandari Bhardwaj Bhasin
Bhatia Bhatt Bhattacharya Bhosale Bose Chadha Chakraborty Chandra Chatterjee Chauhan Chawla Chopra
Choudhary Das Dasgupta Datta Dave Desai Deshmukh Deshpande Dhillon Dixit Dubey Dutta Gandhi Ganguly
Garg Ghosh Gill Goel Gokhale Gupta Hegde Iyer Iyengar Jain Jha Joshi Kadam Kapoor Kashyap Kaur
Khanna Khurana Kohli Krishnan Kulkarni Kumar Lal Mahajan Malhotra Malik Mehra Mehta Menon Mishra
Mittal Modi Mukherjee Murthy Nair Naidu Narang Nayak Pandey Pandit Parekh Patel Pathak Patil Pillai
Prasad Puri Raghavan Rajan Rao Rastogi Rathore Reddy Roy Sahni Saini Saxena Sen Sengupta Seth
Shah Sharma Shetty Shinde Shukla Sibal Singh Sinha Sood Srinivasan Subramanian Suri Tandon Thakur
Tiwari Trivedi Upadhyay Varma Venkatesh Verma Vyas Wadhwa Yadav Acharya Adhikari Aiyar Anand
Apte Awasthi Bedi Bhagat Bhave Biswas Chaudhuri Chhabra Chitnis Damle Dhawan Dhar Dhawale Dwivedi
Gadgil Gaikwad Ganesan Gaur Ghai Godbole Gowda Grover Hazarika Inamdar Jadhav Jaiswal Jindal Johar
Joglekar Kakkar Kamath Kanade Kannan Karnik Kaushik Khatri Kher Kini Kothari Kumari Lamba Lele
Luthra Mahadevan Mane Mathur Mazumdar Mhatre Mohanty Mukund Nadkarni Nagpal Nambiar Nanda Natarajan
Oberoi Ojha Padmanabhan Pai Panda Paranjape Pawar Phadke Prabhu Purohit Raina Rajput Ramachandran
Ranade Rangan Rathi Raut Sabharwal Sahu Sampath Sarin Sathe Sawant Sehgal Sekhar Sethi Shastri
Shenoy Shirodkar Shrivastava Sikka Sodhi Swamy Talwar Tata Thapar Thomas Tripathi Uppal Vaidya
Vasudevan Vora Wagh Walia Yadav Zaveri Agnihotri Bhide Chaturvedi Deol Gill Kale Kelkar Khandelwal
Lokhande Mangal Mistry Nagarajan Pradhan Ramaswamy Salvi Talreja Tendulkar Thakkar Vohra Wadia
Bhushan Chakrabarti Dange Gulati Hora Jayaraman Kalra Lakhani Manchanda Nath Pal Raju Sachdev
Tyagi Venugopal Bhalerao Chari Dalal Gera Hingorani Kamble Kapadia Madan Narula Pande Rege Sarkar
Taneja Upadhye Vartak Chandran Doshi Easwaran Gandhe Hukku Ingle Jethmalani Ahire Bhonsle
Chavan Dutt Ghatge Halder Jog Karve Lahiri Mainkar Nimbalkar Pendse Ranganathan Sabnis Tambe
Unnikrishnan Vakil Wani Yagnik Zutshi Bapat Chougule Dalvi Gharat
`);
const westernFemale = words(`
Abigail Ada Alice Amelia Amy Andrea Angela Anna Audrey Ava Barbara Beatrice Bella Bethany Brenda
Brooke Camila Caroline Catherine Charlotte Chloe Claire Clara Daisy Dana Diana Donna Dorothy Eleanor
Elena Eliza Elizabeth Ella Ellen Emily Emma Erin Eva Evelyn Fiona Florence Frances Gemma Georgia
Grace Hannah Harper Hazel Heather Helen Holly Iris Isabel Ivy Jane Janet Jasmine Jennifer Jessica
Joan Josephine Joy Julia Julie Karen Kate Katherine Kelly Laura Lauren Leah Lily Linda Lisa Lucy
Lydia Mabel Madison Margaret Maria Martha Mary Megan Melanie Mia Michelle Molly Nancy Naomi Natalie
Nicole Nina Nora Olivia Paige Pamela Penelope Phoebe Rachel Rebecca Rose Ruby Ruth Samantha Sarah
Scarlett Sofia Sophie Stella Susan Sylvia Tessa Theresa Valerie Victoria Violet Vivian Wendy Zoe
Agnes Alma Bonnie Cecilia Delia Edith Faye Gloria Harriet Ingrid Jill Kathleen Leona Marion Nell
Opal Polly Rosalind Selma Tamsin Una Vera Willa Yvonne Adele Bridget Carmen Dora Elsie Flora Greta
Helena Imogen Juliet Lorna Maeve
`);
const westernMale = words(`
Aaron Adam Adrian Alan Albert Alex Alfred Andrew Anthony Arthur Austin Barry Benjamin Bernard Blake
Bradley Brian Bruce Caleb Calvin Cameron Carl Charles Christian Christopher Colin Connor Daniel
David Dennis Derek Dominic Douglas Dylan Edward Elliot Eric Ethan Felix Francis Frank Frederick
Gabriel Gavin George Gordon Graham Gregory Harold Harry Henry Hugh Ian Isaac Jack Jacob James Jason
Jeffrey Jeremy Jesse Joel John Jonathan Joseph Joshua Julian Justin Keith Kenneth Kevin Kyle Lawrence
Leo Leonard Liam Logan Louis Lucas Luke Malcolm Marcus Mark Martin Matthew Max Michael Miles Nathan
Neil Nicholas Noah Oliver Oscar Owen Patrick Paul Peter Philip Quentin Ralph Raymond Richard Robert
Roger Ronald Ross Russell Ryan Samuel Scott Sean Simon Stephen Steven Stuart Theodore Thomas Timothy
Toby Tom Travis Trevor Tyler Victor Vincent Walter Warren Wesley William Zachary Abel Basil Clyde
Desmond Edgar Fergus Gilbert Horace Ivan Jasper Kurt Lionel Morris Nigel Otto Percy Rupert Silas
`);
const westernSurnames = words(`
Abbott Adams Allen Anderson Armstrong Atkinson Bailey Baker Baldwin Barker Barnes Bates Bell Bennett
Black Blake Bond Booth Bradley Brooks Brown Bryant Burke Burns Butler Campbell Carpenter Carroll
Carter Chambers Chapman Clark Clarke Cole Coleman Collins Cook Cooper Cox Crawford Cross Cunningham
Davies Davis Dawson Day Dean Dixon Douglas Doyle Duncan Dunn Edwards Elliott Ellis Evans Fisher
Fleming Fletcher Ford Foster Fox Francis Fraser Freeman Gardner Gibson Gilbert Gordon Graham Grant
Gray Green Griffin Hall Hamilton Hansen Harper Harris Harrison Hart Harvey Hawkins Hayes Henderson
Hill Holland Holmes Hopkins Howard Hudson Hughes Hunt Hunter Jackson James Jenkins Johnson Johnston
Jones Jordan Kelly Kennedy King Knight Lambert Lane Lawrence Lawson Lee Lewis Lloyd Long Lowe
Marshall Martin Mason Matthews May Mccarthy Mills Mitchell Moore Morgan Morris Murphy Murray Nelson
Newman Nicholson Norris Oliver Owen Palmer Parker Parsons Payne Pearce Perry Peters Phillips Pierce
Porter Powell Price Quinn Reed Reid Reynolds Richards Richardson Riley Roberts Robertson Robinson
Rogers Rose Ross Russell Ryan Saunders Scott Shaw Simmons Simpson Smith Spencer Stevens Stewart
Stone Sullivan Sutton Taylor Thompson Thomson Tucker Turner Wagner Walker Wallace Walsh Ward Warren
Watson Watts Webb Wells West Wheeler White Wilkinson Williams Willis Wilson Wood Woods Wright Young
Ainsley Ashby Barlow Beckett Blackwood Bramley Calloway Carver Chandler Danforth Dorsey Eastwood
Fairfax Farrow Gallagher Garrison Hadley Halloway Hargrove Holloway Kendall Kingsley Langley Lockwood
Merriweather Northcott Oakley Pemberton Prescott Radcliffe Rowland Sinclair Stanton Thornton
Underwood Vaughn Whitaker Winslow Yardley Ashworth Bellamy Corbett Delaney Ellison Fenwick Greer
Hollis Ingram Jarvis Keating Lennox Mercer Nash Osborne Pryce Rhodes Sterling Talbot Upton Vance
Waverly Whitmore Ackerley Bancroft Cartwright Dunmore Eldridge Fairbanks Goodwin Hathaway Irwin
Kirkland Lacey Mortimer Norwood Pickering Redmond Selby Templeton Vernon Westbrook Wilder Ashford
Aldridge Bannister Crowley Dempsey Everett Fairweather Gresham Hargreaves Ironside Jennings
Kimball Lyndon Maddox Nesbitt Overton Pennington Quimby Rutherford Stapleton Thackeray
Whitlock Yates Brennan Caldwell Driscoll
`);

// Fictional companies: invented compounds, filtered against famous brands.
const FAMOUS = words(`
google alphabet apple microsoft amazon meta facebook netflix tesla nvidia intel oracle ibm samsung
sony tata infosys wipro reliance adani mahindra birla hcl airtel jio flipkart paytm zomato swiggy
uber ola walmart target nike adidas pepsi cocacola starbucks disney boeing airbus siemens philips
shell bluestone silverstone redstone northstar sunpower greenpeace blackrock bluebird redwood
goldman salesforce adobe cisco dell lenovo asus acer hp spotify twitter linkedin openai anthropic
bluedart firefox mozilla ubuntu canon nikon panasonic toyota honda suzuki hyundai ford bmw audi
`);
const pre = words(`North Blue Silver Quiet Bright Maple Harbor Cedar Copper Willow Amber Coral Ember
Hollow Ivory Juniper Lumen Meadow Nimbus Opal Pine Quartz River Saffron Tidal Velvet Wren Zephyr`);
const root = words(`wind peak field brook vale crest ridge gate stone leaf haven point light
bridge wave grove ford mark shore spring`);
const sfx = words(`Labs Works Systems Analytics Partners Studio Dynamics Ventures`);
const companies = [];
for (const p of pre) for (const r of root) {
  const name = p + r;
  if (!FAMOUS.includes(name.toLowerCase())) companies.push(name);
}

const citiesIndia = words(`Pune Nagpur Indore Bhopal Jaipur Udaipur Jodhpur Surat Vadodara Nashik
Aurangabad Kochi Kozhikode Mysuru Mangaluru Hubballi Coimbatore Madurai Tiruchirappalli Vellore
Visakhapatnam Vijayawada Warangal Raipur Ranchi Patna Guwahati Shillong Dehradun Shimla Amritsar
Ludhiana Chandigarh Lucknow Kanpur Varanasi Agra Gwalior Jabalpur Kolhapur Belagavi Thrissur
Puducherry Bhubaneswar Cuttack Siliguri Gangtok Jammu Ajmer Rajkot`);
const citiesGlobal = words(`Lisbon Porto Valencia Seville Lyon Bordeaux Ghent Utrecht Leipzig Graz
Krakow Gdansk Brno Turku Bergen Aarhus Galway Cork Leeds Bristol Edinburgh Cardiff Halifax Calgary
Ottawa Portland Denver Austin Raleigh Tucson Adelaide Perth Hobart Wellington Dunedin Kyoto Sapporo
Busan Taichung Cebu Penang Kandy Hanoi Nairobi Accra Kigali Montevideo Valparaiso Cusco`)
  ;

const adjectives = words(`Amber Azure Bold Brisk Calm Crimson Daring Dusky Eager Emerald Fabled
Gentle Golden Hidden Hushed Ivory Jade Keen Lucky Mellow Misty Nimble Noble Olive Patient Proud
Quiet Rapid Rustic Scarlet Silent Silver Steady Swift Tawny Tidy Umber Vivid Wandering Wise`);
const nouns = words(`Falcon Heron Otter Lynx Badger Kestrel Marten Puffin Raven Sparrow Tortoise
Walrus Bison Condor Dolphin Egret Ferret Gecko Ibis Jackal Koala Lemur Magpie Narwhal Ocelot
Pelican Quokka Robin Starling Tapir Urchin Vole Wombat Yak Zebra Comet Harbor Lantern Meadow Orchard`);
const codenames = [];
for (const a of adjectives) for (const n of nouns) codenames.push(`${a} ${n}`);

const upiHandles = words(`exampay demobank fakeupi sampleaxis testpay mockbank`);

const write = (name, data) => writeFileSync(join(out, `${name}.json`), JSON.stringify(data, null, 0) + '\n');
write('indian-first-names', { female: indianFemale, male: indianMale });
write('indian-surnames', indianSurnames);
write('western-first-names', { female: westernFemale, male: westernMale });
write('western-surnames', westernSurnames);
write('company-names', { bases: companies, suffixes: sfx, famousBrandBlocklist: FAMOUS });
write('cities', { india: citiesIndia, global: citiesGlobal });
write('codenames', codenames);
write('upi-handles', upiHandles);
console.log({
  indianFemale: indianFemale.length, indianMale: indianMale.length, indianSurnames: indianSurnames.length,
  westernFemale: westernFemale.length, westernMale: westernMale.length, westernSurnames: westernSurnames.length,
  companies: companies.length, cities: citiesIndia.length + citiesGlobal.length, codenames: codenames.length,
});
