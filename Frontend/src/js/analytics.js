// ═══════════ ANALYTICS ═══════════
let chartsBuilt=false;
function buildCharts(){
  if(chartsBuilt)return;
  chartsBuilt=true;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gridColor=isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)';
  const textColor=isDark?'#64748b':'#94a3b8';

  // Hours bar chart
  // const hCtx=document.getElementById('hoursChart');
  // if(hCtx){
  //   new Chart(hCtx,{
  //     type:'bar',
  //     data:{
  //       labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  //       datasets:[{
  //         label:'Study Hours',
  //         data:[3,4.5,2,5,3.5,6,4,2.5,4,3,5.5,4,7,3.5,4,3,5,4.5,3,6.5,4,3,4,3.5,5,4,6.5,3],
  //         backgroundColor:'rgba(124,58,237,0.6)',
  //         borderColor:'rgba(168,85,247,1)',
  //         borderWidth:1,borderRadius:5,
  //       }]
  //     },
  //     options:{
  //       responsive:true,maintainAspectRatio:false,
  //       plugins:{legend:{display:false}},
  //       scales:{
  //         y:{grid:{color:gridColor},ticks:{color:textColor},beginAtZero:true},
  //         x:{grid:{display:false},ticks:{color:textColor,maxTicksLimit:8}}
  //       }
  //     }
  //   });
  // }

  // // Pie chart
  // const pCtx=document.getElementById('pieChart');
  // if(pCtx){
  //   new Chart(pCtx,{
  //     type:'doughnut',
  //     data:{
  //       labels:['Mathematics','Physics','English','History','Other'],
  //       datasets:[{
  //         data:[30,22,20,15,13],
  //         backgroundColor:['#7c3aed','#0ea5e9','#ec4899','#f59e0b','#10b981'],
  //         borderWidth:0,hoverOffset:6,
  //       }]
  //     },
  //     options:{
  //       responsive:true,maintainAspectRatio:false,
  //       plugins:{legend:{position:'bottom',labels:{color:textColor,padding:14,font:{size:11}}}}
  //     }
  //   });
  // }

  // Heatmap
  const heatmap=document.getElementById('heatmapGrid');
  if(heatmap){
    const levels=['','l1','l2','l3','l4'];
    let h='';
    for(let i=0;i<28;i++){
      const lvl=levels[Math.floor(Math.random()*levels.length)];
      h+=`<div class="heatmap-cell ${lvl}" title="Day ${i+1}"></div>`;
    }
    heatmap.innerHTML=h;
  }
}
