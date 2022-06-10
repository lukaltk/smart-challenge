import sys

import heartpy as hp
from scipy.ndimage import mean
  
sample_rate = 250

def pega_min_max(data):
  min = []
  max = []
  c = 0
  for i in range(round(len(data)/250)):
    for j in range(250):
      c=c+1
      if j == 0:
        min.append(data[i*250+j])
        max.append(data[i*250+j])
      else:  
        if  data[i*250+j] <  min[i]:
          min[i] = data[i*250+j]
        if  data[i*250+j] >  max[i]:
          max[i] = data[i*250+j]
  return min, max

def media(lista):
  soma = 0
  for i in range(len(lista)):
    soma = soma + lista[i]
  return soma/len(lista)

def recalc_media(med_vel, med_nv):
  return (med_vel * 10 + med_nv)/11

def init(end):
  fu = 0
  data = hp.get_data(end)
  wd, m = hp.process(data, 250)
  min, max = pega_min_max(data)
  med_min = media(min)
  med_max = media(max)
  dados = []
  for measure in m.keys():
    dados.append(m[measure])
  bpm_ibi = dados[0]*dados[1]
  if bpm_ibi == 60000:
    fu = fu
  else: 
    fu = fu + 1

  return [med_min, med_max , fu]

def run(end, med_minV, med_maxV):
  
  fu = 0
  dados = []
  data = hp.get_data(end)
  data = data[0:7500]
  wd, m = hp.process(data, 250)
  min, max = pega_min_max(data)
  med_min = media(min)
  med_max = media(max)
  for measure in m.keys():
    dados.append(m[measure])
  bpm_ibi = dados[0]*dados[1]
  if bpm_ibi == 60000:
    fu = fu
  else: 
    fu = fu + 1
  if ((med_minV - med_min) * (med_minV - med_min)) > 0.9:
    fu = fu + 1
  else: 
    fu = fu
  if ((med_maxV - med_max) * (med_maxV - med_max)) > 0.9:
    fu = fu + 1
  else: 
    fu = fu
  return [recalc_media(med_minV, med_min), recalc_media(med_maxV, med_max), fu] 

if sys.argv[1] == 'init':
  sys.stdout.flush()
  print(init(str(sys.argv[2])))

elif sys.argv[1] == 'run':
  sys.stdout.flush()
  print(run(str(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])))

else:
  print('Nada')